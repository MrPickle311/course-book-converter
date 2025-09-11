package com.bcc.backend.controller

import com.bcc.api.DefaultApi
import com.bcc.api.model.BookDetailResponse
import com.bcc.api.model.GenerateCourseRequest
import com.bcc.api.model.GenerateCourseResponse
import com.bcc.api.model.PaginatedBooksResponse
import com.bcc.api.model.ProcessPdfResponse
import com.bcc.api.model.TaskSubmissionRequest
import com.bcc.api.model.TaskSubmissionResponse
import com.bcc.backend.service.CourseGeneratorService
import com.bcc.backend.service.PdfProcessor
import com.sun.org.slf4j.internal.LoggerFactory
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.util.*

@RestController
class PdfController(
    private val pdfProcessor: PdfProcessor,
    private val courseGeneratorService: CourseGeneratorService
) : DefaultApi {
    private val logger = LoggerFactory.getLogger(PdfController::class.java)

    @PostMapping("/process", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun process(@RequestPart("file") file: MultipartFile): ResponseEntity<Map<String, Any>> {
    }

    override fun apiV1BooksGet(
        page: @Min(value = 1) @Valid Int?,
        pageSize: @Min(value = 1) @Max(
            value = 200
        ) @Valid Int?,
        search: @Valid String?
    ): ResponseEntity<PaginatedBooksResponse?>? {
        TODO("Not yet implemented")
    }

    override fun apiV1BooksUploadIdGet(uploadId: String?): ResponseEntity<BookDetailResponse?>? {
        TODO("Not yet implemented")
    }

    override fun apiV1CourseGeneratePost(generateCourseRequest: @Valid GenerateCourseRequest?): ResponseEntity<GenerateCourseResponse?>? {
        return try {
            val pdfPath = Path.of("uploads").resolve("${body.uploadId}.pdf").toFile()
            val context = extractPagesText(pdfPath, body.startPage, body.endPage)
            val module = courseGeneratorService.generateFromChapter(
                com.bcc.backend.service.GenerateCourseRequest(body.chapterTitle, context)
            )
            ResponseEntity.ok(mapOf("success" to true, "data" to module))
        } catch (ex: Exception) {
            ResponseEntity.internalServerError().body(mapOf("success" to false, "message" to ex.message))
        }
    }

    override fun apiV1PdfProcessPost(file: MultipartFile?): ResponseEntity<ProcessPdfResponse?>? {
        val name = (file?.originalFilename ?: "upload.pdf").lowercase()
        if (!name.endsWith(".pdf")) {
            return ResponseEntity.badRequest().body(
                mapOf(
                    "success" to false,
                    "message" to "Only PDF files are supported"
                )
            )
        }
        val uploadId = UUID.randomUUID().toString()
        val uploadsDir = Path.of("uploads").toAbsolutePath()
        Files.createDirectories(uploadsDir)
        val dest = uploadsDir.resolve("$uploadId.pdf").toFile()
        return try {
            file.inputStream.use { input ->
                Files.copy(input, dest.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING)
            }
            val res = pdfProcessor.process(dest)
            ResponseEntity.ok(
                mapOf(
                    "success" to true,
                    "message" to "PDF processed successfully",
                    "data" to mapOf(
                        "uploadId" to uploadId,
                        "pageCount" to res.pageCount,
                        "wordCount" to res.wordCount,
                        "chapters" to res.chapters.map {
                            mapOf(
                                "title" to it.title,
                                "level" to it.level,
                                "startPage" to it.startPage,
                                "endPage" to it.endPage
                            )
                        },
                        "structuredCounts" to res.structuredCounts,
                        "images" to res.images,
                        "tables" to res.tables,
                        "cleanText" to res.cleanText
                    )
                )
            )
        } catch (ex: Exception) {
            logger.error("Failed to process PDF", ex)
            ResponseEntity.internalServerError().body(
                mapOf(
                    "success" to false,
                    "message" to ("Failed to process PDF: ${ex.message}")
                )
            )
        }
    }

    override fun apiV1TasksTaskIdSubmitPost(
        taskId: String?,
        taskSubmissionRequest: @Valid TaskSubmissionRequest?
    ): ResponseEntity<TaskSubmissionResponse?>? {
        TODO("Not yet implemented")
    }

    override fun apiV1TasksTaskIdUploadPost(
        taskId: String?,
        file: MultipartFile?
    ): ResponseEntity<TaskSubmissionResponse?>? {
        TODO("Not yet implemented")
    }

    private fun extractPagesText(file: java.io.File, start: Int, end: Int?): String {
        PDDocument.load(file).use { doc ->
            val stripper = PDFTextStripper()
            stripper.startPage = start + 1 // PDFBox is 1-based
            stripper.endPage = (end ?: (doc.numberOfPages - 1)) + 1
            return stripper.getText(doc)
        }
    }
}
