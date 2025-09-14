package com.bcc.backend.service

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.ai.converter.BeanOutputConverter
import org.springframework.ai.vertexai.gemini.VertexAiGeminiChatModel
import org.springframework.stereotype.Service


data class TableOfContentItem @JsonCreator constructor(
    @param:JsonProperty("title") val title: String,
    @param:JsonProperty("page") val page: Int
)

data class TableOfContentResult @JsonCreator constructor(
    @param:JsonProperty("complete") val complete: Boolean,
    @param:JsonProperty("items") val items: List<TableOfContentItem>
)

@Service
class AITableOfContentService(private val chatModel: VertexAiGeminiChatModel) {
    private val logger = LoggerFactory.getLogger(AITableOfContentService::class.java)

    fun extractTableOfContent(doc: PDDocument): TableOfContentResult {
        val totalPages = doc.numberOfPages
        val stripper = PDFTextStripper()
        var pagesToSend = minOf(10, totalPages)
        var lastResult: TableOfContentResult
        while (true) {
            stripper.startPage = 1
            stripper.endPage = pagesToSend
            val text = stripper.getText(doc)
            lastResult = callModel(text)
            logger.info("AI ToC complete={} pagesSent={}", lastResult.complete, pagesToSend)
            if (lastResult.complete || pagesToSend >= totalPages) {
                break
            }
            pagesToSend = minOf(pagesToSend + 3, totalPages)
        }
        return lastResult
    }

    private fun callModel(text: String): TableOfContentResult {
        val beanOutputConverter: BeanOutputConverter<TableOfContentResult?> = BeanOutputConverter(TableOfContentResult::class.java)
        val format = beanOutputConverter.format
        val system = SystemMessage(
            "Extract ONLY top-level (root) Table of Contents entries from raw PDF text. " +
                    "Return STRICT JSON with exactly: " + format + " . " +
                    "Ignore dummy chapters like foreword, preface, about the author, copyright etc. " +
                    "Pages must be zero-based integers. Do NOT include markdown, code fences, prose, or any extra fields. " +
                    "If the provided text contains only part of the ToC, set complete=false."
        )
        val user = UserMessage(
            "Extract root-level ToC JSON from the following pages (first page is 0-based when reporting):\n\n" + text
        )
        val resp = chatModel.call(Prompt(listOf(system, user)))
        return beanOutputConverter.convert(resp.result.output.content) ?: TableOfContentResult(false, listOf())
    }
}
