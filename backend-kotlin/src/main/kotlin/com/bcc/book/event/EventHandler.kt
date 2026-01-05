package com.bcc.book.event

import com.bcc.book.persistence.Book
import com.bcc.book.persistence.BookState
import com.bcc.book.service.BookService
import com.bcc.book.spi.Chapter
import com.bcc.book.spi.ChapterStatus
import com.bcc.course.spi.CourseCreatedEvent
import com.bcc.course.spi.CourseCreationStartedEvent
import com.bcc.course.spi.CourseDeletedEvent
import com.bcc.notifications.NotificationEvent
import com.bcc.uploads.spi.FileCreatedEvent
import com.bcc.uploads.spi.FileUploadProcessedEvent
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDate

@Service("BookEventHandler")
class EventHandler(
    private val bookService: BookService,
    private val applicationEventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @ApplicationModuleListener
    fun on(event: FileCreatedEvent) {
        log.info("Creating temporary book: $event")
        val book = Book(
            uploadId = event.uploadId,
            title = event.fileName,
            uploadDate = LocalDate.now(),
            lastUsedAt = Instant.now()
        )
        bookService.saveBook(book)
    }

    @ApplicationModuleListener
    fun on(event: FileUploadProcessedEvent) {
        log.info("File upload processed: $event")
        createBook(event)
    }

    private fun createBook(event: FileUploadProcessedEvent) {
        val chapters = event.processingSummary.chapters.mapIndexed { _, ch ->
            Chapter(
                startPage = ch.startPage,
                endPage = ch.endPage,
                title = ch.title,
                chapterStatus = ChapterStatus.NOT_GENERATED
            )
        }
        val book = bookService.findBook(event.uploadId) ?: return
        book.title = event.processingSummary.bookTitle
        book.uploadDate = LocalDate.now()
        book.lastUsedAt = Instant.now()
        book.chapters = chapters
        book.bookState = BookState.GENERATED
        bookService.saveBook(book)
        log.info("Book updated $book")
        applicationEventPublisher.publishEvent(NotificationEvent("Book processing complete"))
    }

    @ApplicationModuleListener
    fun on(event: CourseCreationStartedEvent) {
        log.info("Updating course status to GENERATING for ${event.chapter.title}")
        setChaptersToGenerating(event)
    }

    private fun setChaptersToGenerating(event: CourseCreationStartedEvent) {
        val book = bookService.findBook(event.uploadId) ?: return
        book.chapters.find { it.id == event.chapter.id }?.chapterStatus = ChapterStatus.GENERATING
        log.info("Chapter ${event.chapter.id} updated to GENERATING")
    }

    @ApplicationModuleListener
    fun on(event: CourseCreatedEvent) {
        log.info("Updating course status to GENERATED for ${event.chapterId}")
        val chapter = setChapterToGenerated(event) ?: return
        applicationEventPublisher.publishEvent(NotificationEvent("Course ${chapter.title} generated"))
        log.info("Chapter ${event.chapterId} updated to GENERATED")
    }

    private fun setChapterToGenerated(
        event: CourseCreatedEvent
    ): Chapter? {
        val book = bookService.findBook(event.uploadId) ?: return null
        val chapter = book.chapters.find { it.id == event.chapterId }
        chapter?.chapterStatus = ChapterStatus.GENERATED
        return chapter
    }

    @ApplicationModuleListener
    fun on(event: CourseDeletedEvent) {
        log.info("Updating course status to NOT_GENERATED for ${event.chapterId}")
        setChapterToNotGenerated(event)
    }

    private fun setChapterToNotGenerated(event: CourseDeletedEvent) {
        val book = bookService.findBook(event.uploadId) ?: return
        val chapter = book.chapters.find { it.id == event.chapterId }
        val chapterTitle = chapter?.title ?: "Chapter"
        chapter?.chapterStatus = ChapterStatus.NOT_GENERATED
        bookService.saveBook(book)
        applicationEventPublisher.publishEvent(NotificationEvent("Course $chapterTitle deleted"))
        log.info("Chapter ${event.chapterId} updated to NOT_GENERATED")
    }

}