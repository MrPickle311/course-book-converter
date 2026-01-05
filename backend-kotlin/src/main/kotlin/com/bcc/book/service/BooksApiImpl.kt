package com.bcc.book.service

import com.bcc.book.spi.BooksApi
import com.bcc.book.spi.Chapter
import com.bcc.book.persistence.BookRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Service

@Service
class BooksApiImpl (
    private val bookRepository: BookRepository,
    private val objectMapper: ObjectMapper
) : BooksApi {
    override fun getChapter(chapterId: String): Chapter? {
        val data = bookRepository.findChapterById(chapterId)
        return objectMapper.readValue(data, Chapter::class.java)
    }
}