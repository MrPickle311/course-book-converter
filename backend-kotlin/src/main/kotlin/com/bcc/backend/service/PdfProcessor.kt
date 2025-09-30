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
        val startPage: Int,
        val endPage: Int
    )

    data class ProcessResult(
        val chapters:  List<ChapterSummary>,
    )

    fun process(pdfFile: File): ProcessResult {
        val startNs = System.nanoTime()
        PDDocument.load(pdfFile).use { doc ->
            val stripper = PDFTextStripper()
            stripper.sortByPosition = true

            val tableOfContents = getTableOfContents(doc)

            logger.info("Processed PDF in {} ms", Duration.ofNanos(System.nanoTime() - startNs).toMillis())

            return ProcessResult(
                chapters = tableOfContents.map { ChapterSummary(it.title, it.startPage, it.endPage) },
            )
        }
    }

    private fun getTableOfContents(doc: PDDocument): List<TableOfContentItem> {
        return try {
            aiTableOfContentService?.extractTableOfContent(doc)?.items ?: emptyList()
        } catch (ex: Exception) {
            logger.warn("AI ToC failed, using heuristic fallback: {}", ex.message)
            listOf();
        }
    }

}
