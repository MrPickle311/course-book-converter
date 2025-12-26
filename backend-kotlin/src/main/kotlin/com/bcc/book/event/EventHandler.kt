package com.bcc.book.event

import com.bcc.book.persistence.Book
import com.bcc.book.Chapter
import com.bcc.book.service.BookService
import com.bcc.uploads.FileUploadProcessedEvent
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Component
import java.time.Instant
import java.time.LocalDate

@Component
class EventHandler(
    private val bookService: BookService,
) {

    @ApplicationModuleListener
    fun on(event: FileUploadProcessedEvent) {
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
        val book = Book(
            uploadId = event.uploadId,
            title = event.processingSummary.bookTitle,
            uploadDate = LocalDate.now(),
            lastUsedAt = Instant.now(),
            chapters = chapters,
        )
        bookService.saveBook(book)
    }

}