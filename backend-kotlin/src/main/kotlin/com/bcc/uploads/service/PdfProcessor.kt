package com.bcc.uploads.service

import com.bcc.uploads.FileUploadProcessedEvent
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class PdfProcessor(
    val eventPublisher: ApplicationEventPublisher,
    val tableOfContentService: TableOfContentService,
    val uploadService: UploadService,
) {
    private val logger = LoggerFactory.getLogger(PdfProcessor::class.java)

    fun process(uploadId: String) {
        val pdfFile = uploadService.getFile(uploadId)
        val startNs = System.nanoTime()
        PDDocument.load(pdfFile).use { doc ->
            val stripper = PDFTextStripper()
            stripper.sortByPosition = true

            logger.info("Processed PDF in {} ms", Duration.ofNanos(System.nanoTime() - startNs).toMillis())

            val result = tableOfContentService.extractTableOfContent(doc)
            eventPublisher.publishEvent(FileUploadProcessedEvent(uploadId, result))
        }
    }
}
