package com.bcc.book.persistence

import com.bcc.book.spi.Chapter
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.time.LocalDate

enum class BookState(string: String) {
    GENERATING("GENERATING"),
    GENERATED("GENERATED")
}

@Entity
@Table(name = "books")
data class Book(

    @Id
    @Column(name = "id", nullable = false, length = 64)
    var uploadId: String,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "upload_date", nullable = false)
    var uploadDate: LocalDate,

    @Column(name = "last_used_at")
    var lastUsedAt: Instant = Instant.now(),

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "table_of_contents", columnDefinition = "jsonb")
    var chapters: List<Chapter> = emptyList(),

    @Enumerated(EnumType.STRING)
    var bookState: BookState = BookState.GENERATING
)

interface BookRepository : JpaRepository<Book, String> {
    fun findByTitleContainingIgnoreCase(title: String, pageable: Pageable): Page<Book>

    @Query(
        value = """
    SELECT 
        item ->> 'id' as id,
        item ->> 'title' as title,
        CAST(item ->> 'startPage' AS INTEGER) as startPage,
        CAST(item ->> 'endPage' AS INTEGER) as endPage
    FROM 
        books, 
        jsonb_array_elements(table_of_contents) as item 
    WHERE 
        item ->> 'id' = :chapterId
    """,
        nativeQuery = true
    )
    fun findChapterById(@Param("chapterId") chapterId: String): Chapter?
}
