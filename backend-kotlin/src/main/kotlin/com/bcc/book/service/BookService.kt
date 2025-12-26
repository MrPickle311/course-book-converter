package com.bcc.book.service

import com.bcc.book.persistence.Book
import com.bcc.book.persistence.BookRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.domain.Sort.Direction.DESC
import org.springframework.stereotype.Service

@Service
class BookService(
    private val bookRepository: BookRepository,
) {
    fun findBook(uploadId: String): Book? {
        val result = bookRepository.findById(uploadId)
        return if (result.isPresent) result.get() else null
    }

    fun saveBook(book: Book): Book {
        return bookRepository.save(book)
    }

    fun deleteBook(bookId: String) {
        bookRepository.deleteById(bookId)
    }

    fun searchBooks(
        page: Int,
        pageSize: Int,
        search: String?
    ): Page<Book> {
        val pageable = PageRequest.of(page - 1, pageSize, Sort.by(DESC, "lastUsedAt", "uploadDate"))
        val foundBooks = if (!search.isNullOrBlank()) {
            bookRepository.findByTitleContainingIgnoreCase(search.trim(), pageable)
        } else {
            bookRepository.findAll(pageable)
        }
        return foundBooks
    }
}