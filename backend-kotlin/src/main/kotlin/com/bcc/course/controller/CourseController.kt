package com.bcc.course.controller

import com.bcc.api.CourseApi
import com.bcc.api.model.GenerateCourseRequest
import com.bcc.book.BooksApi
import com.bcc.course.CourseCreatedEvent
import com.bcc.course.event.CourseCreationStartedEvent
import com.bcc.course.persistence.Course
import com.bcc.course.persistence.CourseRepository
import com.bcc.course.service.CourseGeneratorService
import com.bcc.uploads.UploadsApi
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.Resource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import java.nio.file.Files
import java.nio.file.Path

@RestController
class CourseController(
    private val booksApi: BooksApi,
    private val eventPublisher: ApplicationEventPublisher,
) : CourseApi {
    private val logger = LoggerFactory.getLogger(CourseController::class.java)

    override fun generateCourse(
        generateCourseRequest: GenerateCourseRequest
    ): ResponseEntity<Void> {
        return try {
            val uploadId = generateCourseRequest.uploadId
            val chapterId = generateCourseRequest.chapterId
            if (uploadId.isNullOrBlank() || chapterId.isNullOrBlank()) {
                return ResponseEntity.badRequest().build()
            }
            val chapter = booksApi.getChapter(chapterId) ?: return ResponseEntity.notFound().build()
            eventPublisher.publishEvent(CourseCreationStartedEvent(uploadId, chapter))
            logger.info("Course $chapterId is done")
            ResponseEntity.accepted().build()
        } catch (ex: Exception) {
            logger.error("Failed to generate course", ex)
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

    override fun getChapterImage(
        uploadId: String,
        chapterId: String,
        filename: String
    ): ResponseEntity<Resource> {
        logger.info("image $filename")
        return try {
            val imagePath = Path.of("uploads")
                .resolve("notes/$uploadId/$chapterId")
                .resolve(filename).toAbsolutePath()
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
}
