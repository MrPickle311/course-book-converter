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
    @param:JsonProperty("firstPage") val startPage: Int,
    @param:JsonProperty("endPage") val endPage: Int
)

data class TableOfContentResult @JsonCreator constructor(
    @param:JsonProperty("complete") val complete: Boolean,
    @param:JsonProperty("items") val items: List<TableOfContentItem>
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
        while (true) {
            splitter.setStartPage(1)
            splitter.setEndPage(pagesToSend)
            val pages = splitter.split(doc)
                .map { stripper.getText(it) }
                .mapIndexed { pageNumber, pageContent -> "$pageNumber :  \n${if (pageContent.isEmpty()) "<EMPTY_PAGE>" else "<PAGE_CONTENT>\n\n" + pageContent + "<\\PAGE_CONTENT>\n\n"}\n" }
                .toString()
            lastResult = callModel(pages)
            logger.info("AI ToC complete={} pagesSent={}", lastResult.complete, pagesToSend)
            if (lastResult.complete || pagesToSend >= totalPages) {
                break
            }
            pagesToSend = minOf(pagesToSend + 10, totalPages)
        }
        return lastResult
    }

    private fun findFirstRelevantPage(tableOfContents: TableOfContentResult, pages: String): Int {
        val system = "Extract ONLY top-level (root) Table of Contents entries from raw PDF text. " +
                "The content of given page is closed witihin <PAGE_CONTENT> ... <\\PAGE_CONTENT> tags " +
                "Ignore generating table of contents items for prefaces, forewords etc ... " +
                "Pages must be zero-based integers. Do NOT include markdown, code fences, prose, or any extra fields. " +
                "If the provided text contains only part of the ToC, set complete=false. But if "
        val user = "Extract root-level ToC JSON from the following pages (first page is 0-based when reporting). " +
                "Remember that pages numbers in page of content are relative, so you need to add some number to them depending where first relevant not ignored chapter is really placed. " +
                "Also provide start page and end page for each chapter \n\n" +
                "I provided input as map<pageNumber,pageContentString>:\n\n${pages}\n\n"
        return chatClient
            .prompt()
            .system(system)
            .user(user)
            .call()
            .entity(Int::class.java)
    }

    private fun callModel(pages: String): TableOfContentResult {
        val system = "Extract ONLY top-level (root) Table of Contents entries from raw PDF text. " +
                "The content of given page is closed witihin <PAGE_CONTENT> ... <\\PAGE_CONTENT> tags " +
                "Ignore generating table of contents items for prefaces, forewords etc ... " +
                "Pages must be zero-based integers. Do NOT include markdown, code fences, prose, or any extra fields. " +
                "If the provided text contains only part of the ToC, set complete=false. But if "
        val user = "Extract root-level ToC JSON from the following pages (first page is 0-based when reporting). " +
                "Remember that pages numbers in page of content are relative, so you need to add some number to them depending where first relevant not ignored chapter is really placed. " +
                "Also provide start page and end page for each chapter \n\n" +
                "I provided input as map<pageNumber,pageContentString>:\n\n${pages}\n\n"
        return chatClient
            .prompt()
            .system(system)
            .user(user)
            .call()
            .entity(TableOfContentResult::class.java)
    }
}
