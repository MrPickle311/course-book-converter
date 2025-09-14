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
    aiTableOfContentServiceProvider: ObjectProvider<AITableOfContentService>
) {
    private val logger = LoggerFactory.getLogger(PdfProcessor::class.java)
    private val aiTableOfContentService: AITableOfContentService? = aiTableOfContentServiceProvider.ifAvailable

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
            val pageCount = doc.numberOfPages

            val toc = buildTocWithAIOrFallback(doc)
            val chapters = splitChaptersFromToc(toc)
            val clean = normalizeText(text)

            val structuredCounts = mapOf(
                "HEADING" to 0,
                "PARAGRAPH" to 0
            )

            logger.info("Processed PDF in {} ms", Duration.ofNanos(System.nanoTime() - startNs).toMillis())

            return ProcessResult(
                pageCount = pageCount,
                wordCount = 0,
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

    private fun buildTocWithAIOrFallback(doc: PDDocument): List<Map<String, Any>> {
        return try {
            aiTableOfContentService?.extractTableOfContent(doc)?.items?.map {
                mapOf(
                    "title" to it.title,
                    "level" to 1,
                    "page" to it.page
                )
            }!!
        } catch (ex: Exception) {
            logger.warn("AI ToC failed, using heuristic fallback: {}", ex.message)
            listOf();
        }
    }

    private fun splitChaptersFromToc(
        toc: List<Map<String, Any>>,
    ): List<ChapterSummary> {
        if (toc.isEmpty()) return emptyList()
        val anchors = toc.filter {
            val title = (it["title"] as? String)?.trim()?.lowercase() ?: ""
            title.isNotBlank() && !shouldDiscardTitle( (it["page"] as? Int) ?: 0)
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

    private fun shouldDiscardTitle(page: Int): Boolean {
        return page < props.pdfDiscardBeforePage
    }
}
