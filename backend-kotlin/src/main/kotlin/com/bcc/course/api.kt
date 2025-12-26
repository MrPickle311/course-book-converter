package com.bcc.course

data class CourseCreatedEvent(
    val uploadId: String,
    val chapterId: String,
    val notes: String
)

interface CourseApi {
    fun isGeneratedContent(bookId: String, chapterId: String): Boolean
    fun countGeneratedChaptersByBookId(bookId: String): Int
}