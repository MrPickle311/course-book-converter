package com.bcc.course.spi

import org.springframework.modulith.NamedInterface
import org.springframework.modulith.PackageInfo
import com.bcc.book.spi.Chapter

data class CourseCreatedEvent(
    val uploadId: String,
    val chapterId: String,
    val notes: String
)

data class CourseCreationStartedEvent(
    val uploadId: String,
    val chapter: Chapter
)

data class CourseDeletedEvent(
    val uploadId: String,
    val chapterId: String,
)

interface CourseApi {
    fun isGeneratedContent(bookId: String, chapterId: String): Boolean
    fun countGeneratedChaptersByBookId(bookId: String): Int
}

@PackageInfo
@NamedInterface("spi")
class ModuleMetadata {}