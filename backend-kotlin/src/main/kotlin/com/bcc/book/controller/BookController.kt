package com.bcc.book.controller

import com.bcc.api.BooksApi
import com.bcc.api.model.*
import com.bcc.book.persistence.Book
import com.bcc.book.persistence.BookRepository
import com.bcc.book.service.BookService
import com.bcc.book.spi.BookDeletedEvent
import com.bcc.book.spi.Chapter
import com.bcc.book.spi.ChapterStatus
import com.bcc.course.spi.CourseApi
import com.bcc.task.spi.TasksApi
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.domain.Sort.Direction.DESC
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.RestController

@RestController
class BookController(
    private val bookRepository: BookRepository,
    private val tasksApi: TasksApi,
    private val bookService: BookService,
    private val courseApi: CourseApi,
    private val applicationEventPublisher: ApplicationEventPublisher
) : BooksApi {
    private val logger = LoggerFactory.getLogger(BookController::class.java)

    override fun getBooksList(
        page: Int,
        pageSize: Int,
        search: String?
    ): ResponseEntity<PaginatedBooksResponse> {
        val foundBooks = bookService.searchBooks(page, pageSize, search)
        val items = foundBooks.content.map { b ->
            val bm = tasksApi.computeBookMetrics(b.uploadId)
            val progress = ProgressData()
                .tasksCount(bm.totalTasks)
                .tasksCompleted(bm.completedTasks)
                .tasksFailed(bm.failedTasks)
            val generatedCount = courseApi.countGeneratedChaptersByBookId(b.uploadId)
            BookSummary()
                .id(b.uploadId)
                .title(b.title)
                .uploadDate(b.uploadDate.toString())
                .lastUsedAt(b.lastUsedAt.toString())
                .progressData(progress)
                .status(BookSummary.StatusEnum.valueOf(b.bookState.toString()))
                .generatedCoursesCount(generatedCount)
        }
        val meta = PaginationMeta()
            .page(page)
            .pageSize(pageSize)
            .total(foundBooks.totalElements.toInt())
            .totalPages(foundBooks.totalPages)
        val libraryMetrics = computeLibraryMetrics(search)

        val books = PaginatedBooks()
            .items(items)
            .pagination(meta)
            .metrics(libraryMetrics)
        return ResponseEntity.ok(PaginatedBooksResponse(books))
    }

    private fun computeLibraryMetrics(search: String?): LibraryMetrics? {
        val allMatching: List<Book> = if (!search.isNullOrBlank()) {
            val all = bookRepository.findByTitleContainingIgnoreCase(
                search.trim(),
                PageRequest.of(0, Int.MAX_VALUE, Sort.by(DESC, "lastUsedAt", "uploadDate"))
            )
            all.content
        } else {
            bookRepository.findAll()
        }

        var totalTasks = 0
        var completedTasks = 0
        var failedTasks = 0
        var completedBooks = 0
        var inProgressBooks = 0
        allMatching.forEach { b ->
            val bookMetrics = tasksApi.computeBookMetrics(b.uploadId)
            totalTasks += bookMetrics.totalTasks
            completedTasks += bookMetrics.completedTasks
            failedTasks += bookMetrics.failedTasks
            if (bookMetrics.totalTasks > 0) {
                if (bookMetrics.completedTasks == bookMetrics.totalTasks && bookMetrics.failedTasks == 0) {
                    completedBooks += 1
                } else {
                    inProgressBooks += 1
                }
            }
        }

        return LibraryMetrics()
            .totalBooks(allMatching.size)
            .completedBooks(completedBooks)
            .inProgressBooks(inProgressBooks)
            .failedTasks(failedTasks)
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .overallProgress((if (totalTasks > 0) completedTasks.toDouble() / totalTasks.toDouble() else 0.0).toFloat())
    }

    override fun getBookById(uploadId: String): ResponseEntity<BookDetail> {
        val book = bookService.findBook(uploadId) ?: return ResponseEntity.notFound().build()
        fun map(item: Chapter): com.bcc.api.model.Chapter {
            val status = item.chapterStatus
            val isGenerated = status == ChapterStatus.GENERATED
            val progress = if (isGenerated) tasksApi.getChapterProgress(book.uploadId, item.id) else null
            return Chapter()
                .chapterId(item.id)
                .title(item.title)
                .startPage(item.startPage)
                .endPage(item.endPage)
                .progressData(progress)
                .isGenerated(isGenerated)
                .status(com.bcc.api.model.Chapter.StatusEnum.valueOf(item.chapterStatus.name))
        }

        val detail = BookDetail()
            .id(book.uploadId)
            .title(book.title)
            .uploadDate(book.uploadDate.toString())
            .chapters(book.chapters.map { map(it) })
        return ResponseEntity.ok(detail)
    }

    @Transactional
    override fun deleteBook(uploadId: String): ResponseEntity<Void> {
        return try {
            bookService.deleteBook(uploadId)
            applicationEventPublisher.publishEvent(BookDeletedEvent(uploadId))
            ResponseEntity.noContent().build()
        } catch (ex: Exception) {
            logger.error("Failed to delete book {}", uploadId, ex)
            ResponseEntity.internalServerError().build()
        }
    }
}
