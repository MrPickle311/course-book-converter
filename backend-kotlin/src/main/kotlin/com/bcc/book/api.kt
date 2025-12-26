package com.bcc.book

import java.util.*

data class Chapter(
    var id: String = UUID.randomUUID().toString(),
    var title: String,
    var startPage: Int = 0,
    var endPage: Int = 0
)

data class BookDeletedEvent(val id: String)

interface BooksApi {
    fun getChapter(chapterId: String): Chapter?

}