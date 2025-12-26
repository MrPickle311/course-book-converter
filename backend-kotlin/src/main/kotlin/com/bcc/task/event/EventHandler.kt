package com.bcc.task.event

import com.bcc.book.spi.BookDeletedEvent
import com.bcc.book.spi.BooksApi
import com.bcc.course.spi.CourseCreatedEvent
import com.bcc.task.service.TaskService
import com.bcc.uploads.spi.UploadsApi
import org.slf4j.LoggerFactory
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path

@Component
class EventHandler(
    private val taskService: TaskService,
    private val booksApi: BooksApi,
    private val uploadsApi: UploadsApi
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @ApplicationModuleListener
    fun on(event: CourseCreatedEvent) {
        val chapter = booksApi.getChapter(event.chapterId)

        if (chapter == null) {
            log.warn("Could not find chapter ${event.chapterId}}")
            return
        }

        val chapterContent = uploadsApi.getChapterContent(event.uploadId, event.chapterId)

        if (chapterContent == null) {
            log.warn("Could not find chapter content ${event.uploadId}}")
            return
        }

        val tasks = taskService.generateTasksFromChapter(chapter.title, chapterContent)
        taskService.persistTasks(event.uploadId, event.chapterId, tasks)
    }

    @ApplicationModuleListener
    fun on(event: BookDeletedEvent) {
        val tasksIds = taskService.deleteTasksByBookId(event.id)
        runCatching {
            val path = Path.of("uploads").resolve("${event.id}.pdf")
            Files.deleteIfExists(path)
            Files.deleteIfExists(Path.of("uploads/notes").resolve(event.id))
            tasksIds.forEach { Files.deleteIfExists(Path.of("uploads/tasks").resolve(it.toString())) }
        }
    }

}