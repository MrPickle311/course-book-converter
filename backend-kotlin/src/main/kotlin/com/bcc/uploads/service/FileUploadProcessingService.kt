package com.bcc.uploads.service

import com.bcc.uploads.spi.ChapterSummary
import com.bcc.uploads.spi.ProcessingSummary
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import org.apache.pdfbox.multipdf.Splitter
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.PDDocumentOutline
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.entity
import org.springframework.stereotype.Service
import java.io.IOException


private data class TableOfContentItem @JsonCreator constructor(
    @param:JsonProperty("title") val title: String,
    @param:JsonProperty("firstPage") var startPage: Int,
    @param:JsonProperty("endPage") var endPage: Int
) {
    fun toChapterSummary(): ChapterSummary = ChapterSummary(title, startPage, endPage)
}

private data class TableOfContentResult @JsonCreator constructor(
    @param:JsonProperty("complete") val complete: Boolean,
    @param:JsonProperty("items") val items: List<TableOfContentItem>
) {
    fun toProcessingSummary(): ProcessingSummary = ProcessingSummary("", items.map { it.toChapterSummary() })
}

private data class FirstRelevantPageResult @JsonCreator constructor(
    @param:JsonProperty("complete") val complete: Boolean,
    @param:JsonProperty("page") val page: Int
)

fun interface TableOfContentService {
    fun extractTableOfContent(doc: PDDocument): ProcessingSummary
}

private class PdfBoxTableOfContentExtractor {

    @JvmRecord
    private data class TempChapter(val title: String?, val startPage: Int)

    @Throws(IOException::class)
    fun extractRootChapters(document: PDDocument): List<TableOfContentItem> {
        val chapters: MutableList<TableOfContentItem> = ArrayList()

        val outline: PDDocumentOutline = document.getDocumentCatalog().getDocumentOutline()
        val totalPages: Int = document.numberOfPages

        var currentItem = outline.firstChild
        val rawChapters: MutableList<TempChapter> = ArrayList()

        while (currentItem != null) {
            val page = currentItem.findDestinationPage(document)
            if (page != null) {
                val pageIndex: Int = document.pages.indexOf(page)
                rawChapters.add(TempChapter(currentItem.title, pageIndex))
            }

            currentItem = currentItem.nextSibling
        }

        for (i in rawChapters.indices) {
            val current: TempChapter = rawChapters.get(i)
            val start: Int = current.startPage
            val end: Int

            if (i < rawChapters.size - 1) {
                end = rawChapters.get(i + 1).startPage
            } else {
                end = totalPages
            }

            chapters.add(TableOfContentItem(current.title ?: "A chapter from page $start to $end", start, end))
        }
        return chapters
    }
}

@Service
class TableOfContentServiceImpl(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build(),
    private val bookTitleProvider: BookTitleProvider
) : TableOfContentService {
    private val logger = LoggerFactory.getLogger(TableOfContentServiceImpl::class.java)
    private val pdfBoxTableOfContentExtractor = PdfBoxTableOfContentExtractor()

    override fun extractTableOfContent(doc: PDDocument): ProcessingSummary {
        val stripper = PDFTextStripper()
        val splitter = Splitter()
        if (doc.documentCatalog.documentOutline != null) {
            logger.info("Proceeding with pdfbox during table of content extraction")
            val chapters = pdfBoxTableOfContentExtractor.extractRootChapters(doc)
            var result = TableOfContentResult(
                true,
                chapters
            ).toProcessingSummary()
            result.bookTitle = bookTitleProvider.getBookTitle(stripper.getText(doc))
            return result
        } else {
            val totalPages = doc.numberOfPages
            var pagesToSend = minOf(10, totalPages)
            var lastResult: TableOfContentResult
            var pages: String
            splitter.setStartPage(1)
            logger.info("Starting table of content extraction")
            while (true) {
                splitter.setEndPage(pagesToSend)
                pages = splitter.split(doc)
                    .map { stripper.getText(it) }
                    .toString()
                lastResult = findTableOfContents(pages)
                logger.info("AI ToC complete={} pagesSent={}", lastResult.complete, pagesToSend)
                if (lastResult.complete || pagesToSend >= totalPages) {
                    break
                }
                pagesToSend = minOf(pagesToSend + 10, totalPages)
            }

            val fileTitle = bookTitleProvider.getBookTitle(pages)

            var firstRelevantPage: FirstRelevantPageResult
            while (true) {
                splitter.setEndPage(pagesToSend)
                pages = splitter.split(doc)
                    .map { stripper.getText(it) }
                    .mapIndexed { pageNumber, pageContent ->
                        "$pageNumber :  \n${if (pageContent.isEmpty()) "<EMPTY_PAGE>" else "<PAGE_CONTENT>\n\n" + pageContent + "<\\PAGE_CONTENT>\n\n"}\n"
                    }
                    .toString()
                firstRelevantPage = findFirstRelevantPage(lastResult, pages)
                if (firstRelevantPage.complete || pagesToSend >= totalPages) {
                    break
                }
                pagesToSend = minOf(pagesToSend + 10, totalPages)
            }

            var bias = 0;
            if (lastResult.items[0].startPage > 0) {
                bias = -1 * lastResult.items[0].startPage;
            }

            for (i in 0 until lastResult.items.size) {
                lastResult.items[i].endPage += firstRelevantPage.page + bias
                lastResult.items[i].startPage += firstRelevantPage.page + bias
            }

            val result = lastResult.toProcessingSummary()
            result.bookTitle = fileTitle
            return result
        }
    }

    private fun findFirstRelevantPage(tableOfContents: TableOfContentResult, pages: String): FirstRelevantPageResult {
        val system = "There are several first pages of a book. " +
                "The content of given page is closed witihin <PAGE_CONTENT> ... <\\PAGE_CONTENT> tags " +
                "Ignore table of contents pages. " +
                "Pages must be zero-based integers. Do NOT process markdown, code fences, prose, or any extra fields. "
        val user =
            "Find first relevant page of first chapter with given title (first page is 0-based when reporting). I need to know where chapter begins. " +
                    "Don't search it from page numbers from given table of contents, this is wrong. Find it from title from provided table of contents. " +
                    "If you cannot find it within book pages content set complete=false. But if you see this page then mark complete=true " +
                    "Here is a chapter that you need to find page for : ${tableOfContents.items[0].title}\n\n" +
                    "I also provided book pages input as map<pageNumber,pageContentString>:\n\n${pages}\n\n"
        return chatClient
            .prompt()
            .system(system)
            .user(user)
            .call()
            .entity<FirstRelevantPageResult>()
    }

    private fun findTableOfContents(pages: String): TableOfContentResult {
        val system = "Extract ONLY top-level (root) Table of Contents entries from raw PDF text. " +
                "Ignore generating table of contents items for prefaces, forewords etc ... " +
                "Pages must be zero-based integers. Do NOT include markdown, code fences, prose, or any extra fields. " +
                "If the provided text contains only part of the ToC, set complete=false. But if you see entire table of contents then mark complete=true"
        val user = "Extract root-level ToC JSON from the following pages (first page is 0-based when reporting). " +
                "Provide start page and end page for each chapter \n\n" +
                "I provided input as map<pageNumber,pageContentString>:\n\n${pages}\n\n"
        return chatClient
            .prompt()
            .system(system)
            .user(user)
            .call()
            .entity<TableOfContentResult>()
    }
}