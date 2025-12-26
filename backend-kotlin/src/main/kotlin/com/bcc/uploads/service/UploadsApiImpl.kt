package com.bcc.uploads.service

import com.bcc.book.BooksApi
import com.bcc.uploads.UploadsApi
import org.apache.pdfbox.multipdf.PageExtractor
import org.apache.pdfbox.pdmodel.PDDocument
import org.springframework.ai.model.Media
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.FileSystemResource
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.util.Comparator
import kotlin.io.path.Path
import kotlin.io.path.moveTo
import kotlin.io.path.name
import kotlin.io.path.pathString

@Service
class UploadsApiImpl(private val uploadService: UploadService, private val booksApi: BooksApi) : UploadsApi {
    override fun getChapterContent(
        uploadId: String,
        chapterId: String
    ): Media? {
        val originalPdf = uploadService.getFile(uploadId) ?: return null
        val chapter = booksApi.getChapter(chapterId) ?: return null

        val bytesStream = ByteArrayOutputStream()
        PDDocument.load(originalPdf).use { doc ->
            val subset = PageExtractor(doc, chapter.startPage, chapter.endPage).extract()
            subset.use { it.save(bytesStream) }
        }
        return Media(MediaType.APPLICATION_PDF, ByteArrayResource(bytesStream.toByteArray()))
    }

    override fun getImagesForChapter(uploadId: String, chapterId: String): List<FileSystemResource> {
        val basePath = uploadService.getChapterPath(uploadId, chapterId)
        return Files.walk(basePath)
            .filter { it.name.contains("figure") }
            .map { FileSystemResource(it) }
            .toList()
    }

    override fun deleteImages(images: List<FileSystemResource>) {
        if (images.isEmpty()) {
            return
        }
        var i = 1
        val splitPath = images.get(0).file.path.split("/")
        val chapterId = splitPath.last()
        val uploadId = splitPath[splitPath.lastIndex - 2]
        val basePath = uploadService.getChapterPath(uploadId, chapterId)

        // delete images
        images.forEach { file -> file.file.delete()}

        //reorder images
        Files.walk(basePath)
            .filter { it.name.contains("figure") }
            .sorted(Comparator.comparingInt {
                it.name.split("/").last().replace("figure-", "").replace(".png", "").toInt()
            })
            .forEach {
                it.moveTo(Path(basePath.pathString + "/" + "figure-$i.png"), true)
                ++i
            }
    }
}