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
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.stereotype.Service
import java.io.File

@Service
class AITocService(private val chatModel: OpenAiChatModel) {
	private val logger = LoggerFactory.getLogger(AITocService::class.java)
	private val mapper = ObjectMapper()

	data class TocNode(
		val title: String,
		val level: Int,
		val page: Int,
		val children: List<TocNode> = emptyList()
	)

	data class TocResult(
		val complete: Boolean,
		val nodes: List<TocNode>
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
			"You extract a hierarchical Table of Contents from raw PDF text. " +
			"Return ONLY valid JSON with fields: complete (boolean) and toc (array of nodes). " +
			"Each node: {title: string, level: number>=1, page: zero-based page integer, children: [...]} . " +
			"If the provided text includes only part of the ToC, set complete=false."
		)
		val user = UserMessage(
			"Extract hierarchical ToC JSON from the following pages (first page is 0-based when reporting):\n\n" + text
		)
		return chatModel.call(Prompt(listOf(system, user)))
	}

	private fun parseResponse(resp: ChatResponse): TocResult {
		val content = resp.result.output.content
		val root: JsonNode = mapper.readTree(content)
		val complete = root.path("complete").asBoolean(false)
		val nodes = mutableListOf<TocNode>()
		val tocNode = root.path("toc")
		if (tocNode.isArray) {
			for (n in tocNode) nodes.add(parseNode(n))
		}
		return TocResult(complete, nodes)
	}

	private fun parseNode(n: JsonNode): TocNode {
		val title = n.path("title").asText("").trim()
		val level = n.path("level").asInt(1)
		val page = n.path("page").asInt(0)
		val children = mutableListOf<TocNode>()
		val arr = n.path("children")
		if (arr.isArray) for (c in arr) children.add(parseNode(c))
		return TocNode(title = title, level = level, page = page, children = children)
	}
}
