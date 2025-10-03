package com.bcc.backend.service

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import org.apache.pdfbox.multipdf.Splitter
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service


data class TableOfContentItem @JsonCreator constructor(
    @param:JsonProperty("title") val title: String,
    @param:JsonProperty("firstPage") var startPage: Int,
    @param:JsonProperty("endPage") var endPage: Int
)

data class TableOfContentResult @JsonCreator constructor(
    @param:JsonProperty("complete") val complete: Boolean,
    @param:JsonProperty("items") val items: List<TableOfContentItem>
)

data class FirstRelevantPageResult @JsonCreator constructor(
    @param:JsonProperty("complete") val complete: Boolean,
    @param:JsonProperty("page") val page: Int
)

@Service
class AITableOfContentService(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build()
) {
    private val logger = LoggerFactory.getLogger(AITableOfContentService::class.java)

    fun extractTableOfContent(doc: PDDocument): TableOfContentResult {
        val totalPages = doc.numberOfPages
        val stripper = PDFTextStripper()
        val splitter = Splitter();
        var pagesToSend = minOf(10, totalPages)
        var lastResult: TableOfContentResult
        var pages: String
        splitter.setStartPage(1)
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

        var firstRelevantPage: FirstRelevantPageResult
        while (true) {
            splitter.setEndPage(pagesToSend)
            pages = splitter.split(doc)
                .map { stripper.getText(it) }
                .mapIndexed { pageNumber, pageContent -> "$pageNumber :  \n${if (pageContent.isEmpty()) "<EMPTY_PAGE>" else "<PAGE_CONTENT>\n\n" + pageContent + "<\\PAGE_CONTENT>\n\n"}\n" }
                .toString()
            firstRelevantPage = findFirstRelevantPage(lastResult, pages)
            if (firstRelevantPage.complete || pagesToSend >= totalPages) {
                break
            }
            pagesToSend = minOf(pagesToSend + 10, totalPages)
        }

        var bias = 0;
        if (lastResult.items[0].startPage > 0){
            bias = -1 * lastResult.items[0].startPage;
        }

        for (i in 0 until lastResult.items.size) {
            lastResult.items[i].endPage += firstRelevantPage.page + bias
            lastResult.items[i].startPage += firstRelevantPage.page + bias
        }

        return lastResult
    }

    private fun findFirstRelevantPage(tableOfContents: TableOfContentResult, pages: String): FirstRelevantPageResult {
        val system = "There are several first pages of a book. " +
                "The content of given page is closed witihin <PAGE_CONTENT> ... <\\PAGE_CONTENT> tags " +
                "Ignore table of contents pages. " +
                "Pages must be zero-based integers. Do NOT process markdown, code fences, prose, or any extra fields. "
        val user = "Find first relevant page of first chapter with given title (first page is 0-based when reporting). I need to know where chapter begins. " +
                "Don't search it from page numbers from given table of contents, this is wrong. Find it from title from provided table of contents. " +
                "If you cannot find it within book pages content set complete=false. But if you see this page then mark complete=true " +
                "Here is a chapter that you need to find page for : ${tableOfContents.items[0].title}\n\n" +
                "I also provided book pages input as map<pageNumber,pageContentString>:\n\n${pages}\n\n"
        return chatClient
            .prompt()
            .system(system)
            .user(user)
            .call()
            .entity(FirstRelevantPageResult::class.java)
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
            .entity(TableOfContentResult::class.java)
    }
}
