package com.bcc.backend.controller

import com.bcc.api.DefaultApi
import com.bcc.api.model.*
import com.bcc.backend.persistence.*
import com.bcc.backend.persistence.Chapter
import com.bcc.backend.service.CourseGeneratorService
import com.bcc.backend.service.PdfProcessor
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDResources
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.awt.image.RenderedImage
import java.nio.file.Files
import java.nio.file.Path
import java.util.*
import javax.imageio.ImageIO


@RestController
class PdfController(
    private val pdfProcessor: PdfProcessor,
    private val courseGeneratorService: CourseGeneratorService,
    private val bookRepository: BookRepository,
    private val chapterContentRepository: ChapterContentRepository,
    private val taskService: com.bcc.backend.service.TaskService
) : DefaultApi {
    private val logger = LoggerFactory.getLogger(PdfController::class.java)

    override fun getBooksList(
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
            BookSummary()
                .id(b.uploadId)
                .title(b.title)
                .uploadDate(b.uploadDate.toString())
                .lastUsedAt(b.lastUsedAt.toString())
        }
        val meta = PaginationMeta()
            .page(p)
            .pageSize(ps)
            .total(pageData.totalElements.toInt())
            .totalPages(pageData.totalPages)
        val payload = PaginatedBooks().items(items).pagination(meta)
        return ResponseEntity.ok(PaginatedBooksResponse(true, payload))
    }

    override fun getBookById(uploadId: String): ResponseEntity<BookDetail> {
        val found = bookRepository.findById(uploadId)
        if (found.isEmpty) {
            return ResponseEntity.notFound().build()
        }
        val book = found.get()
        fun mapToc(item: Chapter): com.bcc.api.model.Chapter {
            val isGenerated = chapterContentRepository.findByBookIdAndChapterId(book.uploadId, item.id) != null
            return com.bcc.api.model.Chapter()
                .chapterId(item.id)
                .title(item.title)
                .startPage(item.startPage)
                .endPage(item.endPage)
                .progressData(
                    if (isGenerated) ChapterProgressData()
                        .tasksCount(5)
                        .tasksFailed(1)
                        .tasksCompleted(2)
                    else null
                )
                .isGenerated(isGenerated)
        }

        val detail = BookDetail()
            .id(book.uploadId)
            .title(book.title)
            .uploadDate(book.uploadDate.toString())
            .chapters(book.chapters.map { mapToc(it) })
        return ResponseEntity.ok(detail)
    }

    override fun deleteBook(uploadId: String): ResponseEntity<Void> {
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

    override fun generateCourse(
        generateCourseRequest: @Valid GenerateCourseRequest
    ): ResponseEntity<GenerateCourseResponse> {
        return try {
            val uploadId = generateCourseRequest.uploadId
            val chapterId = generateCourseRequest.chapterId
            if (uploadId.isNullOrBlank() || chapterId.isNullOrBlank()) {
                return ResponseEntity.badRequest().build()
            }

            val pdfPath = Path.of("uploads").resolve("$uploadId.pdf").toFile()

            // Try to reuse stored chapter content first
            val chapterContent = chapterContentRepository.findByBookIdAndChapterId(uploadId, chapterId)
            val contextTitleStartEnd = if (chapterContent != null) {
                Triple(
                    chapterContent.content,
                    chapterContent.title,
                    Pair(chapterContent.startPage, chapterContent.endPage)
                )
            } else {
                val book = bookRepository.findByUploadId(uploadId) ?: return ResponseEntity.notFound().build()
                val chapter = book.chapters.firstOrNull { it.id == chapterId }
                if (chapter == null) {
                    return ResponseEntity.notFound().build()
                }
                val start = chapter.startPage
                val end = chapter.endPage
                val text = extractPagesText(pdfPath, start, end)

                // Persist for future reuse
                chapterContentRepository.save(
                    ChapterContent(
                        bookId = uploadId,
                        chapterId = chapterId,
                        title = chapter.title,
                        startPage = start,
                        endPage = end,
                        content = text
                    )
                )

                Triple(text, chapter.title, Pair(start, end))
            }
            val context = contextTitleStartEnd.first
            val title = contextTitleStartEnd.second
            val pagesRange = contextTitleStartEnd.third
            val module = courseGeneratorService.generateFromChapter(
                CourseGeneratorService.GenerateCourseRequest(
                    title,
                    context
                )
            )

            val outDir = Path.of("uploads").resolve("notes/${uploadId}/${chapterId}").toAbsolutePath()
            Files.createDirectories(outDir)

            PDDocument.load(pdfPath).use { doc ->
                val firstPage = pagesRange.first
                val lastPage = pagesRange.second ?: (doc.numberOfPages - 1)
                for (page in firstPage..lastPage) {
                    val pageImages = getImagesFromResources(doc.pages[page].resources)
                    pageImages.forEachIndexed { idx, it ->
                        val filename = "page-$page-$idx.png"
                        val filePath = outDir.resolve(filename)
                        ImageIO.write(it, "png", filePath.toFile())
                    }
                }
            }

            val mdxPath = outDir.resolve("index.mdx")
            Files.writeString(mdxPath, module.notes.mdx)

            val response = GenerateCourseResponse()
                .title(module.notes.title)
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

    override fun processPdf(file: MultipartFile): ResponseEntity<ProcessPdfResponse> {
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
            val chapters = res.chapters.mapIndexed { _, ch ->
                Chapter(
                    startPage = ch.startPage,
                    endPage = ch.endPage,
                    title = ch.title,
                )
            }
            val book = Book(
                uploadId = uploadId,
                title = (file.originalFilename ?: "Uploaded Book").removeSuffix(".pdf"),
                uploadDate = java.time.LocalDate.now(),
                lastUsedAt = java.time.Instant.now(),
                chapters = chapters,
            )
            bookRepository.save(book)
            val data = ProcessPdfData()
                .uploadId(uploadId)
                .chapters(book.chapters.map { ch ->
                    com.bcc.api.model.Chapter()
                        .title(ch.title)
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

    override fun submitTask(
        taskId: String,
        taskSubmissionRequest: @Valid TaskSubmissionRequest
    ): ResponseEntity<TaskSubmissionResponse> {
        val type = taskSubmissionRequest.type?.value ?: ""

        if (type == "multiple-choice") {
            val sel = taskSubmissionRequest.selectedOptionId
            val isCorrect = sel != null
            val mistakes = if (isCorrect) emptyList() else listOf("Incorrect option selected")
            val chatEval = taskService.evaluateChoicesWithChat("", emptyList(), listOfNotNull(sel), emptyList(), false)
            val eval = chatEval.copy(
                isCorrect = isCorrect && (chatEval.isCorrect != false),
                mistakes = if (!isCorrect) mistakes else chatEval.mistakes,
                score = if (isCorrect) (chatEval.score ?: 1.0) else 0.0,
                explanation = chatEval.explanation ?: if (isCorrect) "Correct" else "Incorrect"
            )
            // Update Task state JSON directly via TaskService helper (to be implemented)
        } else if (type == "multiple-select") {
            val sel = taskSubmissionRequest.selectedOptionIds ?: emptyList()
            val expected = emptyList<String>()
            val missing = expected.filter { !sel.contains(it) }
            val extra = sel.filter { !expected.contains(it) }
            val isCorrect = missing.isEmpty() && extra.isEmpty()
            val mistakes = buildList {
                if (missing.isNotEmpty()) add("Missing: ${missing.joinToString(", ")}")
                if (extra.isNotEmpty()) add("Extra: ${extra.joinToString(", ")}")
            }
            val score =
                if (expected.isNotEmpty()) sel.count { expected.contains(it) }.toDouble() / expected.size else 0.0
            val chatEval = taskService.evaluateChoicesWithChat("", emptyList(), sel, expected, true)
            val eval = chatEval.copy(
                isCorrect = isCorrect && (chatEval.isCorrect != false),
                mistakes = if (!isCorrect) mistakes else chatEval.mistakes,
                score = if (isCorrect) maxOf(score, chatEval.score ?: score) else score,
                explanation = chatEval.explanation
            )
            // Update Task state JSON directly
        } else if (type == "short-answer") {
            val txt = taskSubmissionRequest.textAnswer?.trim() ?: ""
            val eval = taskService.evaluateTextWithChat("", txt, type)
            // Update Task state JSON directly
        } else {
            val eval = Evaluation(
                isCorrect = false,
                mistakes = listOf("Unsupported task type: $type"),
                score = 0.0,
                explanation = null
            )
            // Update Task state JSON directly
        }

        val saved = Evaluation(isCorrect = false, mistakes = emptyList(), score = 0.0, explanation = null)
        val apiEval = TaskEvaluation()
            .isCorrect(saved?.isCorrect == true)
            .mistakes(saved?.mistakes ?: emptyList())
            .score(java.math.BigDecimal.valueOf(saved?.score ?: 0.0))
            .explanation(saved?.explanation)
        val resp = TaskSubmissionResponse().success(true).evaluation(apiEval)
        return ResponseEntity.ok(resp)
    }

    override fun submitTaskFile(
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
            // Extract text from PDF to feed Chat for grading context
            val extractedText = if (isPdf) runCatching {
                org.apache.pdfbox.pdmodel.PDDocument.load(dest.toFile()).use { doc ->
                    val stripper = org.apache.pdfbox.text.PDFTextStripper()
                    stripper.getText(doc)
                }
            }.getOrElse { "" } else ""
            val eval = if (isPdf) taskService.evaluateTextWithChat(
                "Uploaded PDF task",
                extractedText.take(8000),
                "upload-pdf"
            ) else Evaluation(isCorrect = false, mistakes = mistakes, score = 0.0, explanation = "Invalid file")
            // Update Task state JSON via TaskService (not implemented here)

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

    override fun getChapterNotes(uploadId: String, chapterId: String): ResponseEntity<String> {
        return try {
            val mdxPath =
                Path.of("uploads").resolve("notes/${uploadId}/${chapterId}").resolve("index.mdx").toAbsolutePath()
            if (!Files.exists(mdxPath)) {
                return ResponseEntity.notFound().build()
            }
            val content = Files.readString(mdxPath)
            ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/markdown"))
                .body(content)
        } catch (ex: Exception) {
            logger.error("Failed to get chapter notes", ex)
            ResponseEntity.internalServerError().build()
        }
    }

    override fun getChapterTasks(uploadId: String, chapterId: String): ResponseEntity<ChapterTasksResponse> {
        return try {
            val resp = taskService.getOrCreateTasks(uploadId, chapterId)
            ResponseEntity.ok(resp)
        } catch (ex: Exception) {
            logger.error("Failed to get chapter tasks for {}/{}", uploadId, chapterId, ex)
            ResponseEntity.internalServerError().build()
        }
    }

    override fun getChapterImage(
        uploadId: String,
        chapterId: String,
        filename: String
    ): ResponseEntity<Resource> {
        println("image ${filename}")
        return try {
            val imagePath = Path.of("uploads").resolve("notes/$uploadId/$chapterId").resolve(filename).toAbsolutePath()
            if (!Files.exists(imagePath) || !Files.isRegularFile(imagePath)) {
                return ResponseEntity.notFound().build()
            }
            val bytes = Files.readAllBytes(imagePath)
            val contentType = Files.probeContentType(imagePath) ?: "application/octet-stream"
            ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(ByteArrayResource(bytes))
        } catch (ex: Exception) {
            logger.error("Failed to get chapter image {} for {}/{}", filename, uploadId, chapterId, ex)
            ResponseEntity.internalServerError().build()
        }
    }

    private fun getImagesFromResources(resources: PDResources): MutableList<RenderedImage?> {
        val images: MutableList<RenderedImage?> = ArrayList<RenderedImage?>()

        for (xObjectName in resources.xObjectNames) {
            val xObject = resources.getXObject(xObjectName)

            if (xObject is PDFormXObject) {
                images.addAll(getImagesFromResources(xObject.getResources()))
            } else if (xObject is PDImageXObject) {
                images.add(xObject.image)
            }
        }

        return images
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
