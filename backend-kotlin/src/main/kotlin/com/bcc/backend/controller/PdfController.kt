package com.bcc.backend.controller

import com.bcc.api.DefaultApi
import com.bcc.api.model.BookDetail
import com.bcc.api.model.BookDetailResponse
import com.bcc.api.model.Chapter
import com.bcc.api.model.CourseModule
import com.bcc.api.model.CourseSection
import com.bcc.api.model.CourseTask
import com.bcc.api.model.GenerateCourseRequest
import com.bcc.api.model.GenerateCourseResponse
import com.bcc.api.model.PaginatedBooks
import com.bcc.api.model.PaginatedBooksResponse
import com.bcc.api.model.PaginationMeta
import com.bcc.api.model.ProcessPdfData
import com.bcc.api.model.ProcessPdfResponse
import com.bcc.api.model.TaskSubmissionRequest
import com.bcc.api.model.TaskSubmissionResponse
import com.bcc.backend.service.CourseGeneratorService
import com.bcc.backend.service.PdfProcessor
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
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

    override fun apiV1BooksGet(
        page: @Min(1) @Valid Int?,
        pageSize: @Min(1) @Max(200) @Valid Int?,
        search: @Valid String?
    ): ResponseEntity<PaginatedBooksResponse> {
        val items = emptyList<com.bcc.api.model.BookSummary>()
        val meta = PaginationMeta()
            .page(page ?: 1)
            .pageSize(pageSize ?: 20)
            .total(0)
            .totalPages(0)
        val payload = PaginatedBooks()
            .items(items)
            .pagination(meta)
        return ResponseEntity.ok(PaginatedBooksResponse(true, payload))
    }

    override fun apiV1BooksUploadIdGet(uploadId: String): ResponseEntity<BookDetailResponse> {
        val detail = BookDetail()
            .id(uploadId)
            .title("Unknown")
            .uploadDate("")
            .tableOfContents(emptyList())
        return ResponseEntity.ok(BookDetailResponse(true, detail))
    }

    override fun apiV1CourseGeneratePost(
        generateCourseRequest: @Valid GenerateCourseRequest
    ): ResponseEntity<GenerateCourseResponse> {
        return try {
            val pdfPath = Path.of("uploads").resolve("${generateCourseRequest.uploadId}.pdf").toFile()
            val context = extractPagesText(pdfPath, generateCourseRequest.startPage ?: 0, generateCourseRequest.endPage)
            val module = courseGeneratorService.generateFromChapter(
                CourseGeneratorService.GenerateCourseRequest(
                    generateCourseRequest.chapterTitle,
                    context
                )
            )
            val apiModule = CourseModule()
                .title(module.title)
                .objectives(module.objectives)
                .sections(module.sections.map { s ->
                    CourseSection()
                        .title(s.title)
                        .summary(s.summary)
                        .keyConcepts(s.keyConcepts)
                })
                .tasks(module.tasks.map { t ->
                    CourseTask()
                        .type(t.type)
                        .title(t.title)
                        .description(t.description)
                        .successCriteria(t.successCriteria)
                })
            ResponseEntity.ok(GenerateCourseResponse(true, apiModule))
        } catch (ex: Exception) {
            logger.error("Failed to generate course", ex)
            ResponseEntity.internalServerError().build()
        }
    }

    override fun apiV1PdfProcessPost(file: MultipartFile): ResponseEntity<ProcessPdfResponse> {
        val name = (file.originalFilename ?: "upload.pdf").lowercase()
        if (!name.endsWith(".pdf")) {
            return ResponseEntity.badRequest().build()
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
            val data = ProcessPdfData()
                .uploadId(uploadId)
                .pageCount(res.pageCount)
                .wordCount(res.wordCount)
                .chapters(res.chapters.map { ch ->
                    Chapter()
                        .title(ch.title)
                        .level(ch.level)
                        .startPage(ch.startPage)
                        .endPage(ch.endPage)
                })
            val body = ProcessPdfResponse(true, data).message("PDF processed successfully")
            ResponseEntity.ok(body)
        } catch (ex: Exception) {
            logger.error("Failed to process PDF", ex)
            ResponseEntity.internalServerError().build()
        }
    }

    override fun apiV1TasksTaskIdSubmitPost(
        taskId: String,
        taskSubmissionRequest: @Valid TaskSubmissionRequest
    ): ResponseEntity<TaskSubmissionResponse> {
        TODO("Not yet implemented")
    }

    override fun apiV1TasksTaskIdUploadPost(
        taskId: String,
        file: MultipartFile
    ): ResponseEntity<TaskSubmissionResponse> {
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
