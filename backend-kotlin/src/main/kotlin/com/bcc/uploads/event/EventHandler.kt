package com.bcc.uploads.event

import com.bcc.book.spi.BookDeletedEvent
import com.bcc.book.spi.BooksApi
import com.bcc.course.spi.CourseCreatedEvent
import com.bcc.uploads.spi.CourseContentUpdatedCreatedEvent
import com.bcc.uploads.spi.CourseFilesCreatedEvent
import com.bcc.uploads.service.PdfProcessor
import com.bcc.uploads.service.UploadService
import com.bcc.uploads.spi.FileCreatedEvent
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDResources
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Service
import java.awt.image.RenderedImage
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO

@Service("UploadsEventHandler")
class EventHandler(
    private val pdfProcessor: PdfProcessor,
    private val uploadService: UploadService,
    private val booksApi: BooksApi,
    private val applicationEventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @ApplicationModuleListener
    fun on(event: FileCreatedEvent) {
        log.info("File created: $event")
        pdfProcessor.process(event.uploadId)
    }

    @ApplicationModuleListener
    fun on(event: CourseContentUpdatedCreatedEvent) {
        log.info("Course content updated: $event")
        val chapterFile = uploadService.getChapterPath(event.uploadId, event.chapterId).resolve("index.mdx").toFile()
        chapterFile.writeText(event.notes)
    }

    @ApplicationModuleListener
    fun on(event: BookDeletedEvent) {
        log.info("Book deleted $event")
        runCatching {
            val path = Path.of("uploads").resolve("${event.id}.pdf")
            Files.deleteIfExists(path)
            Files.deleteIfExists(Path.of("uploads/notes").resolve(event.id))
            Files.deleteIfExists(Path.of("uploads/tasks").resolve(event.id))
        }.onFailure { log.error("Error while deleting $event", it) }
    }

    @ApplicationModuleListener
    fun on(event: com.bcc.course.spi.CourseDeletedEvent) {
        log.info("Course deleted $event")
        runCatching {
            Files.deleteIfExists(Path.of("uploads/notes").resolve(event.uploadId).resolve(event.chapterId))
            Files.deleteIfExists(Path.of("uploads/tasks").resolve(event.uploadId).resolve(event.chapterId))
        }.onFailure { log.error("Error while deleting $event", it) }
    }

    @ApplicationModuleListener
    fun on(event: CourseCreatedEvent) {
        log.info("Course created: $event")

        val chapter = booksApi.getChapter(event.chapterId)
        if (chapter == null) {
            log.warn("Chapter ${event.chapterId} not found")
            return
        }

        // save notes to file
        log.info("Saving notes to file ${event.chapterId}")
        val outDir = uploadService.getChapterPath(event.uploadId, event.chapterId)
        val mdxPath = outDir.resolve("index.mdx")
        Files.writeString(mdxPath, event.notes)
        //images extraction
        log.info("Images extraction for ${event.chapterId}")
        val pdfPath = uploadService.getFile(event.uploadId)
        PDDocument.load(pdfPath).use { doc ->
            val firstPage = chapter.startPage
            val lastPage = chapter.endPage
            var i = 1
            for (page in firstPage..lastPage) {
                val pageImages = getImagesFromResources(doc.pages[page].resources)
                pageImages.forEach {
                    val filename = "figure-$i.png"
                    val filePath = outDir.resolve(filename)
                    ImageIO.write(it, "png", filePath.toFile())
                    ++i
                }
            }
        }

        applicationEventPublisher.publishEvent(CourseFilesCreatedEvent(event.uploadId,event.chapterId, event.notes))
    }

    private fun getImagesFromResources(resources: PDResources): MutableList<RenderedImage?> {
        val images: MutableList<RenderedImage?> = ArrayList<RenderedImage?>()

        for (xObjectName in resources.xObjectNames) {
            val xObject = resources.getXObject(xObjectName)

            if (xObject is PDFormXObject) {
                images.addAll(getImagesFromResources(xObject.getResources()))
            } else if (xObject is PDImageXObject) {
                images.add(xObject.image)
            }
        }

        return images
    }
}