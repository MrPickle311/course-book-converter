package com.bcc.backend.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatResponse
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.ai.vertexai.gemini.VertexAiGeminiChatModel
import org.springframework.stereotype.Service
import java.io.File

@Service
class AITocService(private val chatModel: VertexAiGeminiChatModel) {
	private val logger = LoggerFactory.getLogger(AITocService::class.java)
	private val mapper = ObjectMapper()

	data class TocItem(
		val title: String,
		val page: Int
	)

	data class TocResult(
		val complete: Boolean,
		val items: List<TocItem>
	)

	fun extractToc(pdfFile: File): TocResult {
		PDDocument.load(pdfFile).use { doc ->
			val totalPages = doc.numberOfPages
			val stripper = PDFTextStripper()
			var pagesToSend = minOf(10, totalPages)
			var lastResult: TocResult = TocResult(false, emptyList())
			while (true) {
				stripper.startPage = 1
				stripper.endPage = pagesToSend
				val text = stripper.getText(doc)
				val response = callModel(text)
				lastResult = parseResponse(response)
				logger.debug("AI ToC complete={} pagesSent={}", lastResult.complete, pagesToSend)
				if (lastResult.complete || pagesToSend >= totalPages) break
				pagesToSend = minOf(pagesToSend + 3, totalPages)
			}
			return lastResult
		}
	}

	private fun callModel(text: String): ChatResponse {
		val system = SystemMessage(
			"Extract ONLY top-level (root) Table of Contents entries from raw PDF text. " +
			"Return STRICT JSON with exactly: { complete: boolean, toc: [ { title: string, page: integer } ] }. " +
			"Pages must be zero-based integers. Do NOT include markdown, code fences, prose, or any extra fields. " +
			"If the provided text contains only part of the ToC, set complete=false."
		)
		val user = UserMessage(
			"Extract root-level ToC JSON from the following pages (first page is 0-based when reporting):\n\n" + text
		)
		return chatModel.call(Prompt(listOf(system, user)))
	}

	private fun parseResponse(resp: ChatResponse): TocResult {
		val raw = resp.result.output.content
		val content = extractJson(raw)
		val root: JsonNode = mapper.readTree(content)
		val complete = root.path("complete").asBoolean(false)
		val items = mutableListOf<TocItem>()
		val tocNode = root.path("toc")
		if (tocNode.isArray) {
			for (n in tocNode) {
				val title = n.path("title").asText("").trim()
				val page = n.path("page").asInt(0)
				if (title.isNotEmpty()) items.add(TocItem(title = title, page = page))
			}
		}
		return TocResult(complete, items)
	}

	private fun extractJson(text: String): String {
		val trimmed = text.trim()
		if (trimmed.startsWith("```")) {
			// Remove code fences like ```json ... ``` or ``` ... ```
			val fence = "```"
			val first = trimmed.indexOf(fence)
			val last = trimmed.lastIndexOf(fence)
			if (first >= 0 && last > first) {
				val inner = trimmed.substring(first + fence.length, last).trim()
				// Strip optional language tag (e.g., 'json') on the first line
				val newline = inner.indexOf('\n')
				return if (newline > 0) inner.substring(newline + 1).trim() else inner.trim()
			}
		}
		// Fallback: take substring between first '{' and last '}' if present
		val start = trimmed.indexOf('{')
		val end = trimmed.lastIndexOf('}')
		if (start >= 0 && end > start) {
			return trimmed.substring(start, end + 1).trim()
		}
		logger.debug("extractJson: returning raw content due to no fences/braces detected")
		return trimmed
	}
}
