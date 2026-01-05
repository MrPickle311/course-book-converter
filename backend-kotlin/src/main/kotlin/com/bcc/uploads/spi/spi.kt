package com.bcc.uploads.spi

import org.springframework.ai.content.Media
import org.springframework.core.io.FileSystemResource
import org.springframework.modulith.NamedInterface
import org.springframework.modulith.PackageInfo

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

data class FileCreatedEvent(
    val fileName: String,
    val uploadId: String
)

interface UploadsApi{
    fun getChapterContent(uploadId: String, chapterId: String): Media?
    fun getImagesForChapter(uploadId: String, chapterId: String): List<FileSystemResource>
    fun saveImage(uploadId: String, chapterId: String, imageName: String, image: ByteArray)
    fun deleteImages(images: List<FileSystemResource>)
    fun updateChapterContent(uploadId: String, chapterId: String, content: String)
    fun getChapterNotes(uploadId: String, chapterId: String): String?
    fun getImage(uploadId: String, chapterId: String, filename: String): ByteArray?
}

@PackageInfo
@NamedInterface("spi")
class ModuleMetadata {}