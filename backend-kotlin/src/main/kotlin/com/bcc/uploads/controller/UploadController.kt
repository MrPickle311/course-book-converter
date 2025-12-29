package com.bcc.uploads.controller

import com.bcc.api.UploadApi
import com.bcc.api.model.ProcessPdfResponse
import com.bcc.uploads.spi.FileCreatedEvent
import com.bcc.uploads.service.UploadService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
class UploadController(
    private val uploadService: UploadService,
    private val eventPublisher: ApplicationEventPublisher
) : UploadApi {
    private val logger = LoggerFactory.getLogger(UploadController::class.java)

    @Transactional
    override fun processPdf(file: MultipartFile): ResponseEntity<ProcessPdfResponse> {
        return try {
            val uploadId = uploadService.createFile(file) ?: return ResponseEntity.badRequest().build()
            eventPublisher.publishEvent(FileCreatedEvent(file.originalFilename ?: "file.pdf", uploadId))
            ResponseEntity.ok(ProcessPdfResponse(uploadId))
        } catch (ex: Exception) {
            logger.error("Failed to process PDF", ex)
            ResponseEntity.internalServerError().build()
        }
    }
}
