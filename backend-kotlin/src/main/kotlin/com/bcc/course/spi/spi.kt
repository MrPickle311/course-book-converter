package com.bcc.course.spi

import org.springframework.modulith.NamedInterface
import org.springframework.modulith.PackageInfo

data class CourseCreatedEvent(
    val uploadId: String,
    val chapterId: String,
    val notes: String
)

interface CourseApi {
    fun isGeneratedContent(bookId: String, chapterId: String): Boolean
    fun countGeneratedChaptersByBookId(bookId: String): Int
}

@PackageInfo
@NamedInterface("spi")
class ModuleMetadata {}
