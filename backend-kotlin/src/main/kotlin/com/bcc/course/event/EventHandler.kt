package com.bcc.course.event

import com.bcc.book.spi.BookDeletedEvent
import com.bcc.course.persistence.Course
import com.bcc.course.persistence.CourseRepository
import com.bcc.course.service.CourseGeneratorService
import com.bcc.course.service.ImageFilterService
import com.bcc.course.spi.CourseCreatedEvent
import com.bcc.course.spi.CourseCreationStartedEvent
import com.bcc.uploads.spi.CourseContentUpdatedCreatedEvent
import com.bcc.uploads.spi.CourseFilesCreatedEvent
import com.bcc.uploads.spi.UploadsApi
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Service

@Service("CourseEventHandler")
class EventHandler(
    private val courseRepository: CourseRepository,
    private val imageFilterService: ImageFilterService,
    private val applicationEventPublisher: ApplicationEventPublisher,
    private val courseGeneratorService: CourseGeneratorService,
    private val uploadsApi: UploadsApi
){
    private val log = LoggerFactory.getLogger(this::class.java)

    @ApplicationModuleListener
    fun on(event: BookDeletedEvent) {
        log.info("Book deleted $event")
        courseRepository.deleteByBookId(event.id)
        log.info("Coruse for book removed $event")
    }

    @ApplicationModuleListener
    fun on(event: CourseCreationStartedEvent) {
        log.info("Course creation started $event")

        val start = event.chapter.startPage
        val end = event.chapter.endPage

        val title = event.chapter.title
        val pdfMedia = uploadsApi.getChapterContent(event.uploadId, event.chapter.id)
        log.info("Got chapter pdf media for ${event.uploadId}")

        if (pdfMedia == null) {
            log.warn("Could not find content for given chapter ${event.uploadId} for this book: ${event.uploadId}")
            return
        }

        val notes = courseGeneratorService.generateNotesForChapter(
            title,
            pdfMedia,
        )

        courseRepository.save(
            Course(
                bookId = event.uploadId,
                chapterId = event.chapter.id,
                title = event.chapter.title,
                startPage = start,
                endPage = end
            )
        )
        applicationEventPublisher.publishEvent(CourseCreatedEvent(event.uploadId, event.chapter.id, notes))
    }

    @ApplicationModuleListener
    fun on(event: CourseFilesCreatedEvent){
        log.info("Course files created $event")
//        imageFilterService.filterMarkdownImages(event.uploadId, event.chapterId, event.notes)

        val newContent = addBasePathToImages(
            event.notes,
            "http://localhost:8080/api/v1/books/${event.uploadId}/chapters/${event.chapterId}/images"
        )

        applicationEventPublisher.publishEvent(CourseContentUpdatedCreatedEvent(event.uploadId, event.chapterId, newContent))
    }
    @ApplicationModuleListener
    fun on(event: com.bcc.course.spi.CourseDeletedEvent) {
        log.info("Course deleted $event")
        courseRepository.deleteByBookIdAndChapterId(event.uploadId, event.chapterId)
    }
}

fun addBasePathToImages(content: String, basePath: String): String {
    // Regex pattern to match Markdown images: ![alt text](image-path)
    val markdownImagePattern = """!\[([^\]]*)\]\(([^)]+)\)""".toRegex()

    return markdownImagePattern.replace(content) { matchResult ->
        val altText = matchResult.groupValues[1]
        val originalPath = matchResult.groupValues[2]

        // Skip if it's already an absolute URL (http://, https://, etc.)
        if (originalPath.matches("""^[a-zA-Z][a-zA-Z\d+\-.]*:""".toRegex())) {
            return@replace matchResult.value
        }

        val newPath = if (originalPath.startsWith("/")) {
            "$basePath$originalPath"
        } else {
            "$basePath/$originalPath"
        }

        // Reconstruct the Markdown image
        "![$altText]($newPath)"
    }
}
