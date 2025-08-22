package com.bcc.backend.service

import com.bcc.backend.config.AppProperties
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.ObjectProvider
import org.springframework.stereotype.Service
import java.io.File
import java.time.Duration

@Service
class PdfProcessor(
	private val props: AppProperties,
	aiTocServiceProvider: ObjectProvider<AITocService>
) {
	private val logger = LoggerFactory.getLogger(PdfProcessor::class.java)
	private val aiTocService: AITocService? = aiTocServiceProvider.ifAvailable

	data class ChapterSummary(
		val title: String,
		val level: Int,
		val startPage: Int,
		val endPage: Int?
	)

	data class ProcessResult(
		val pageCount: Int,
		val wordCount: Int,
		val chapters: List<ChapterSummary>,
		val structuredCounts: Map<String, Int>,
		val images: Int,
		val tables: Int,
		val toc: List<Map<String, Any>>,
		val cleanText: Map<String, Any>
	)

	fun process(pdfFile: File): ProcessResult {
		val startNs = System.nanoTime()
		PDDocument.load(pdfFile).use { doc ->
			val stripper = PDFTextStripper()
			stripper.sortByPosition = true
			val text = stripper.getText(doc)
			val rawWords = text.split("\\s+".toRegex()).filter { it.isNotBlank() }
			val pageCount = doc.numberOfPages

			val headings = detectHeadings(text)
			val toc = buildTocWithAIOrFallback(pdfFile, headings)
			val chapters = splitChaptersFromToc(toc, pageCount)
			val clean = normalizeText(text)

			val structuredCounts = mapOf(
				"HEADING" to headings.size,
				"PARAGRAPH" to 0
			)

			logger.info("Processed PDF in {} ms", Duration.ofNanos(System.nanoTime() - startNs).toMillis())

			return ProcessResult(
				pageCount = pageCount,
				wordCount = rawWords.size,
				chapters = chapters,
				structuredCounts = structuredCounts,
				images = 0,
				tables = 0,
					// retain key names used by frontend/backend
				toc = toc,
				cleanText = mapOf(
					"wordCount" to (clean["wordCount"] ?: 0),
					"removedElements" to (clean["removedElements"] ?: emptyList<String>())
				)
			)
		}
	}

	private fun buildTocWithAIOrFallback(pdfFile: File, headings: List<Pair<String, Int>>): List<Map<String, Any>> {
		return try {
			val ai = aiTocService
			if (ai != null) {
				val result = ai.extractToc(pdfFile)
				if (result.nodes.isNotEmpty()) return flattenToc(result)
			}
			buildToc(headings)
		} catch (ex: Exception) {
			logger.warn("AI ToC failed, using heuristic fallback: {}", ex.message)
			buildToc(headings)
		}
	}

	private fun flattenToc(result: AITocService.TocResult): List<Map<String, Any>> {
		val out = mutableListOf<Map<String, Any>>()
		fun walk(node: AITocService.TocNode) {
			out.add(mapOf("title" to node.title, "level" to node.level, "page" to node.page))
			node.children.forEach { walk(it) }
		}
		result.nodes.forEach { walk(it) }
		return out
	}

	private fun detectHeadings(text: String): List<Pair<String, Int>> {
		// naive line-based heuristic similar to Python's size/level check
		val lines = text.lines()
		val result = mutableListOf<Pair<String, Int>>()
		for (line in lines) {
			val trimmed = line.trim()
			if (trimmed.length < 4) continue
			val lower = trimmed.lowercase()
			val looksLikeChapter =
				lower.matches(Regex("^chapter\\s+\\d+.*")) ||
				lower.matches(Regex("^ch\\.\\s*\\d+.*")) ||
				lower.matches(Regex("^\\d+\\.\\s+.*")) ||
				lower.matches(Regex("^part\\s+\\d+.*")) ||
				lower.matches(Regex("^section\\s+\\d+.*"))
			val looksLikeTitle = trimmed.matches(Regex("^[A-Z][A-Za-z0-9\\s,'\\-:]{6,}$"))
			if (looksLikeChapter || looksLikeTitle) {
				val level = if (looksLikeChapter) 1 else 2
				result.add(trimmed to level)
			}
		}
		return result
	}

	private fun buildToc(headings: List<Pair<String, Int>>): List<Map<String, Any>> {
		// Without reliable page mapping in PDFBox text-only mode, page set to 0
		return headings.map { (title, level) ->
			mapOf(
				"title" to title,
				"level" to level,
				"page" to 0
			)
		}
	}

	private fun splitChaptersFromToc(
								 toc: List<Map<String, Any>>,
								 pageCount: Int
	): List<ChapterSummary> {
		if (toc.isEmpty()) return emptyList()
		val anchors = toc.filter {
			val title = (it["title"] as? String)?.trim()?.lowercase() ?: ""
			title.isNotBlank() && !shouldDiscardTitle(title, (it["page"] as? Int) ?: 0)
		}
		if (anchors.isEmpty()) return emptyList()
		val rootLevel = anchors.minOf { (it["level"] as? Int) ?: 1 }
		val top = anchors.filter { (it["level"] as? Int ?: rootLevel) == rootLevel }
		val chapters = mutableListOf<ChapterSummary>()
		for ((idx, item) in top.withIndex()) {
			val start = (item["page"] as? Int) ?: 0
			val end = if (idx + 1 < top.size) {
				val nextStart = (top[idx + 1]["page"] as? Int) ?: 0
				maxOf(start, nextStart - 1)
			} else null
			chapters.add(
				ChapterSummary(
					title = (item["title"] as String).trim(),
					level = 1,
					startPage = start,
					endPage = end
				)
			)
		}
		return chapters
	}

	private fun normalizeText(raw: String): Map<String, Any> {
		val removed = mutableListOf<String>()
		var cleaned = raw.replace("\\s+".toRegex(), " ")
		removed.add("excessive_whitespace")
		val lines = cleaned.lines()
		val kept = mutableListOf<String>()
		for (line in lines) {
			val t = line.trim()
			if (t.matches(Regex("^\\d+$")) && t.length <= 3) {
				removed.add("page_numbers")
				continue
			}
			if (t.length < 5 && t == t.uppercase()) {
				removed.add("short_headers")
				continue
			}
			kept.add(t)
		}
		val normalized = kept.joinToString(" ")
		return mapOf(
			"wordCount" to normalized.split("\\s+".toRegex()).filter { it.isNotBlank() }.size,
			"removedElements" to removed.distinct()
		)
	}

	private fun shouldDiscardTitle(title: String, page: Int): Boolean {
		if (page < props.pdfDiscardBeforePage) return true
		for (bad in props.pdfDiscardTitles) {
			if (title.contains(bad)) return true
		}
		return false
	}
}
