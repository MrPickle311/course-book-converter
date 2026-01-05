package com.bcc.uploads.service

import com.bcc.book.spi.BooksApi
import com.bcc.uploads.spi.UploadsApi
import org.apache.pdfbox.multipdf.PageExtractor
import org.apache.pdfbox.pdmodel.PDDocument
import org.slf4j.LoggerFactory
import org.springframework.ai.content.Media
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.FileSystemResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.util.Comparator
import kotlin.io.path.Path
import kotlin.io.path.moveTo
import kotlin.io.path.name
import kotlin.io.path.pathString

@Service
class UploadsApiImpl(
    private val uploadService: UploadService,
    private val booksApi: BooksApi
) : UploadsApi {
    private val logger = LoggerFactory.getLogger(UploadsApiImpl::class.java)

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

    override fun saveImage(
        uploadId: String,
        chapterId: String,
        imageName: String,
        image: ByteArray
    ) {
        logger.info("Saving image $imageName")
        val basePath = uploadService.getChapterPath(uploadId, chapterId)
        basePath.resolve(imageName).toFile().writeBytes(image)
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

    override fun updateChapterContent(uploadId: String, chapterId: String, content: String) {
        val mdxPath =
            Path.of("uploads").resolve("notes/${uploadId}/${chapterId}").resolve("index.mdx").toAbsolutePath()
        if (!Files.exists(mdxPath)) {
            return
        }
        Files.writeString(mdxPath, content)
    }

    override fun getImage(uploadId: String, chapterId: String, filename: String): ByteArray? {
        val imagePath = Path.of("uploads")
            .resolve("notes/$uploadId/$chapterId")
            .resolve(filename).toAbsolutePath()
        if (!Files.exists(imagePath) || !Files.isRegularFile(imagePath)) {
            return null
        }
        return Files.readAllBytes(imagePath)
    }

    override fun getChapterNotes(uploadId: String, chapterId: String): String? {
        val mdxPath =
            Path.of("uploads").resolve("notes/${uploadId}/${chapterId}").resolve("index.mdx").toAbsolutePath()
        if (!Files.exists(mdxPath)) {
            return null;
        }
        return Files.readString(mdxPath)
    }
}