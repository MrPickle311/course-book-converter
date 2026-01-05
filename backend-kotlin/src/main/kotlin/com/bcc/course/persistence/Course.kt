package com.bcc.course.persistence

import jakarta.persistence.*
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.*

@Entity
@Table(
    name = "chapter_contents", indexes = [
        Index(name = "idx_chapter_content_book_chapter", columnList = "book_id,chapter_id")
    ]
)
data class Course(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    var id: UUID? = null,
    @Column(name = "book_id", nullable = false, length = 64)
    var bookId: String,
    @Column(name = "chapter_id", nullable = false, length = 128)
    var chapterId: String,
    @Column(name = "title", nullable = false)
    var title: String,
    @Column(name = "start_page", nullable = false)
    var startPage: Int,
    @Column(name = "end_page")
    var endPage: Int?,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)

interface CourseRepository : JpaRepository<Course, UUID> {
    fun findByBookIdAndChapterId(bookId: String, chapterId: String): Course?
    fun countByBookId(bookId: String): Long
    fun deleteByBookId(bookId: String)
    fun deleteByBookIdAndChapterId(bookId: String, chapterId: String)
}

