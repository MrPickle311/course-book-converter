package com.bcc.book.service

import com.bcc.book.spi.BooksApi
import com.bcc.book.spi.Chapter
import com.bcc.book.persistence.BookRepository
import org.springframework.stereotype.Service

@Service
class BooksApiImpl (
    private val bookRepository: BookRepository,
) : BooksApi {
    override fun getChapter(chapterId: String): Chapter? {
        return bookRepository.findChapterById(chapterId)
    }
}