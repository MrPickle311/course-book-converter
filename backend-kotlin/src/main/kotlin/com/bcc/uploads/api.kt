package com.bcc.uploads

import org.springframework.ai.model.Media
import org.springframework.core.io.FileSystemResource

data class ChapterSummary(
    val title: String,
    val startPage: Int,
    val endPage: Int
)

data class ProcessingSummary(
    var bookTitle: String,
    val chapters: List<ChapterSummary>
)

data class FileUploadProcessedEvent(
    val uploadId: String,
    val processingSummary: ProcessingSummary
)

data class CourseFilesCreatedEvent(
    val uploadId: String,
    val chapterId: String,
    val notes: String
)

data class CourseContentUpdatedCreatedEvent(
    val uploadId: String,
    val chapterId: String,
    val notes: String
)

interface UploadsApi{
    fun getChapterContent(uploadId: String, chapterId: String): Media?
    fun getImagesForChapter(uploadId: String, chapterId: String): List<FileSystemResource>
    fun deleteImages(images: List<FileSystemResource>)
}