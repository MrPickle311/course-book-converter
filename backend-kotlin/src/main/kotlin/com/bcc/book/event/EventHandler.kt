package com.bcc.book.event

import com.bcc.book.persistence.Book
import com.bcc.book.persistence.BookState
import com.bcc.book.service.BookService
import com.bcc.book.spi.Chapter
import com.bcc.book.spi.ChapterStatus
import com.bcc.course.spi.CourseCreatedEvent
import com.bcc.course.spi.CourseCreationStartedEvent
import com.bcc.uploads.spi.FileCreatedEvent
import com.bcc.uploads.spi.FileUploadProcessedEvent
import org.slf4j.LoggerFactory
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDate

@Service("BookEventHandler")
class EventHandler(
    private val bookService: BookService,
    private val notificationController: com.bcc.book.controller.NotificationController
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
        notificationController.sendNotification("Book processing complete")
    }

    @ApplicationModuleListener
    fun on(event: CourseCreationStartedEvent) {
        log.info("Updating course status to GENERATING for ${event.chapter.title}")
        var book = bookService.findBook(event.uploadId) ?: return
        book.chapters.find { it.id == event.chapter.id }?.chapterStatus = ChapterStatus.GENERATING
        log.info("Chapter ${event.chapter.id} updated to GENERATING")
    }

    @ApplicationModuleListener
    fun on(event: CourseCreatedEvent) {
        log.info("Updating course status to GENERATED for ${event.chapterId}")
        var book = bookService.findBook(event.uploadId) ?: return
        var chapter = book.chapters.find { it.id == event.chapterId }
        chapter?.chapterStatus = ChapterStatus.GENERATED
        notificationController.sendNotification("Course ${chapter?.title ?: ""} generated")
        log.info("Chapter ${event.chapterId} updated to GENERATED")
    }

    @ApplicationModuleListener
    fun on(event: com.bcc.course.spi.CourseDeletedEvent) {
        log.info("Updating course status to NOT_GENERATED for ${event.chapterId}")
        val book = bookService.findBook(event.uploadId) ?: return
        val chapter = book.chapters.find { it.id == event.chapterId }
        chapter?.chapterStatus = ChapterStatus.NOT_GENERATED
        bookService.saveBook(book)
        log.info("Chapter ${event.chapterId} updated to NOT_GENERATED")
    }

}