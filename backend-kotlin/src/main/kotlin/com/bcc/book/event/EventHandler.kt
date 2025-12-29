package com.bcc.book.event

import com.bcc.book.persistence.Book
import com.bcc.book.persistence.BookState
import com.bcc.book.service.BookService
import com.bcc.book.spi.Chapter
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
            )
        }
        val book = bookService.findBook(event.uploadId) ?: return
        book.title = event.processingSummary.bookTitle
        book.uploadDate = LocalDate.now()
        book.lastUsedAt = Instant.now()
        book.chapters = chapters
        book.bookState = BookState.GENERATED
        log.info("Book updated $book")
    }

}