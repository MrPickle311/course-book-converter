package com.bcc.backend.controller

import com.bcc.api.DefaultApi
import com.bcc.api.model.*
import com.bcc.backend.persistence.*
import com.bcc.backend.service.CourseGeneratorService
import com.bcc.backend.service.PdfProcessor
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.util.*


@RestController
class PdfController(
    private val pdfProcessor: PdfProcessor,
    private val courseGeneratorService: CourseGeneratorService,
    private val bookRepository: BookRepository,
    private val taskSubmissionRepository: TaskSubmissionRepository,
    private val chapterContentRepository: ChapterContentRepository
) : DefaultApi {
    private val logger = LoggerFactory.getLogger(PdfController::class.java)

    override fun apiV1BooksGet(
        page: @Min(1) @Valid Int?,
        pageSize: @Min(1) @Max(200) @Valid Int?,
        search: @Valid String?
    ): ResponseEntity<PaginatedBooksResponse> {
        val p = (page ?: 1).coerceAtLeast(1)
        val ps = (pageSize ?: 20).coerceIn(1, 200)
        val pageable = PageRequest.of(p - 1, ps, Sort.by(Sort.Direction.DESC, "lastUsedAt", "uploadDate"))
        val pageData = if (!search.isNullOrBlank()) {
            bookRepository.findByTitleContainingIgnoreCase(search.trim(), pageable)
        } else {
            bookRepository.findAll(pageable)
        }
        val items = pageData.content.map { b ->
            val s = BookSummary()
                .id(b.id)
                .title(b.title)
                .uploadDate(b.uploadDate.toString())
            if (b.lastUsedAt != null) {
                s.lastUsedAt(b.lastUsedAt.toString())
            }
            s
        }
        val meta = PaginationMeta()
            .page(p)
            .pageSize(ps)
            .total(pageData.totalElements.toInt())
            .totalPages(pageData.totalPages)
        val payload = PaginatedBooks().items(items).pagination(meta)
        return ResponseEntity.ok(PaginatedBooksResponse(true, payload))
    }

    override fun apiV1BooksUploadIdGet(uploadId: String): ResponseEntity<BookDetailResponse> {
        val found = bookRepository.findById(uploadId)
        if (found.isEmpty) {
            return ResponseEntity.notFound().build()
        }
        val b = found.get()
        fun mapToc(item: TableOfContentItem): TocItem {
            return TocItem()
                .id(item.id)
                .title(item.title)
                .page(item.page)
                .hasSubchapters(item.hasSubchapters)
                .subchapters(item.subchapters.map { mapToc(it) })
        }
        val detail = BookDetail()
            .id(b.id)
            .title(b.title)
            .uploadDate(b.uploadDate.toString())
            .tableOfContents(b.tableOfContents.map { mapToc(it) })
        return ResponseEntity.ok(BookDetailResponse(true, detail))
    }

    override fun apiV1BooksUploadIdDelete(uploadId: String): ResponseEntity<Void> {
        return try {
            bookRepository.deleteById(uploadId)
            // best-effort remove uploaded file
            runCatching {
                val path = Path.of("uploads").resolve("$uploadId.pdf")
                Files.deleteIfExists(path)
            }
            ResponseEntity.noContent().build()
        } catch (ex: Exception) {
            logger.error("Failed to delete book {}", uploadId, ex)
            ResponseEntity.internalServerError().build()
        }
    }

    override fun apiV1CourseGeneratePost(
        generateCourseRequest: @Valid GenerateCourseRequest
    ): ResponseEntity<GenerateCourseResponse> {
        return try {
            val pdfPath = Path.of("uploads").resolve("${generateCourseRequest.uploadId}.pdf").toFile()
            val start = generateCourseRequest.startPage
            val end = generateCourseRequest.endPage
            val context = extractPagesText(pdfPath, start, end)
            // Persist chapter content for future reuse
            val chapterId = chapterIdFromPage(generateCourseRequest.uploadId, start)
            chapterContentRepository.save(
                ChapterContent(
                    bookId = generateCourseRequest.uploadId,
                    chapterId = chapterId,
                    title = generateCourseRequest.chapterTitle,
                    startPage = start,
                    endPage = end,
                    content = context
                )
            )
            val module = courseGeneratorService.generateFromChapter(
                CourseGeneratorService.GenerateCourseRequest(
                    generateCourseRequest.chapterTitle,
                    context
                )
            )
            val response = GenerateCourseResponse()
                .title(module.title)
                .objectives(module.objectives)
                .content("")
                .tasks(module.tasks.map { t ->
                    CourseTask()
                        .type(t.type)
                        .title(t.title)
                        .description(t.description)
                        .successCriteria(t.successCriteria)
                })
            ResponseEntity.ok(response)
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
            // Persist book document with ToC built from chapter start pages
            val tableOfContentItems = res.chapters.mapIndexed { idx, ch ->
                TableOfContentItem(
                    id = "$uploadId-${idx + 1}",
                    title = ch.title.trim(),
                    page = ch.startPage,
                    hasSubchapters = false,
                    subchapters = emptyList()
                )
            }
            val book = Book(
                id = uploadId,
                title = (file.originalFilename ?: "Uploaded Book").removeSuffix(".pdf"),
                uploadDate = java.time.LocalDate.now(),
                lastUsedAt = java.time.Instant.now(),
                tableOfContents = tableOfContentItems,
                pageCount = res.pageCount,
                wordCount = res.wordCount
            )
            bookRepository.save(book)
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
        // Basic evaluation logic
        val type = taskSubmissionRequest.type?.value ?: ""
        val mistakes = mutableListOf<String>()
        var score = 0.0
        var isCorrect = false
        when (type) {
            "multiple-choice" -> {
                val sel = taskSubmissionRequest.selectedOption
                if (sel.isNullOrBlank()) mistakes.add("No option selected") else {
                    isCorrect = true; score = 1.0
                }
            }
            "multiple-select" -> {
                val sel = taskSubmissionRequest.selectedOptions ?: emptyList()
                if (sel.isEmpty()) mistakes.add("No options selected") else {
                    // Without answer key, mark as completed
                    isCorrect = true; score = 1.0
                }
            }
            "short-answer", "code" -> {
                val txt = taskSubmissionRequest.textAnswer?.trim() ?: ""
                if (txt.isBlank()) mistakes.add("Answer is empty")
                if (txt.length < 40) mistakes.add("Answer is too short")
                isCorrect = mistakes.isEmpty()
                score = if (isCorrect) 1.0 else if (txt.isNotBlank()) 0.5 else 0.0
            }
            else -> mistakes.add("Unsupported task type: $type")
        }

        val eval = Evaluation(
            isCorrect = isCorrect,
            mistakes = mistakes,
            score = score,
            explanation = if (mistakes.isEmpty()) "Looks good" else "Please review the feedback"
        )
        val submission = TaskSubmission(
            taskId = taskId,
            userId = null,
            type = type,
            selectedOption = taskSubmissionRequest.selectedOption,
            selectedOptions = taskSubmissionRequest.selectedOptions,
            textAnswer = taskSubmissionRequest.textAnswer,
            fileName = null,
            evaluation = eval
        )
        taskSubmissionRepository.save(submission)

        val apiEval = TaskEvaluation()
            .isCorrect(isCorrect)
            .mistakes(mistakes)
            .score(java.math.BigDecimal.valueOf(score))
            .explanation(eval.explanation)
        val resp = TaskSubmissionResponse()
            .success(true)
            .evaluation(apiEval)
        return ResponseEntity.ok(resp)
    }

    override fun apiV1TasksTaskIdUploadPost(
        taskId: String,
        file: MultipartFile
    ): ResponseEntity<TaskSubmissionResponse> {
        val original = (file.originalFilename ?: "upload.bin").lowercase()
        val isPdf = original.endsWith(".pdf")
        val mistakes = mutableListOf<String>()
        if (!isPdf) mistakes.add("Only PDF files are supported")
        val uploadDir = Path.of("uploads", "tasks", taskId).toAbsolutePath()
        Files.createDirectories(uploadDir)
        val storedName = UUID.randomUUID().toString() + "-" + original
        val dest = uploadDir.resolve(storedName)
        return try {
            file.inputStream.use { input ->
                Files.copy(input, dest, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
            }
            val eval = Evaluation(
                isCorrect = mistakes.isEmpty(),
                mistakes = mistakes,
                score = if (mistakes.isEmpty()) 1.0 else 0.0,
                explanation = if (mistakes.isEmpty()) "File uploaded successfully" else "Invalid file"
            )
            val submission = TaskSubmission(
                taskId = taskId,
                userId = null,
                type = "upload-pdf",
                fileName = storedName,
                evaluation = eval
            )
            taskSubmissionRepository.save(submission)

            val apiEval = TaskEvaluation()
                .isCorrect(eval.isCorrect == true)
                .mistakes(eval.mistakes ?: emptyList())
                .score(java.math.BigDecimal.valueOf(eval.score ?: 0.0))
                .explanation(eval.explanation)
            val resp = TaskSubmissionResponse()
                .success(true)
                .evaluation(apiEval)
            ResponseEntity.ok(resp)
        } catch (ex: Exception) {
            logger.error("Failed to store task file", ex)
            ResponseEntity.internalServerError().build()
        }
    }

    private fun extractPagesText(file: java.io.File, start: Int, end: Int?): String {
        PDDocument.load(file).use { doc ->
            val stripper = PDFTextStripper()
            stripper.startPage = start + 1 // PDFBox is 1-based
            stripper.endPage = (end ?: (doc.numberOfPages - 1)) + 1
            return stripper.getText(doc)
        }
    }

    private fun chapterIdFromPage(uploadId: String, startPage: Int): String = "$uploadId-$startPage"
}
