package com.bcc.backend.persistence

import com.vladmihalcea.hibernate.type.json.JsonType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.Type
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.time.LocalDate
import java.util.*

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

    @Type(JsonType::class)
    @Column(name = "table_of_contents", columnDefinition = "jsonb")
    var chapters: List<Chapter> = emptyList(),
)

data class Chapter(
    var id: String = UUID.randomUUID().toString(),
    var title: String,
    var startPage: Int = 0,
    var endPage: Int = 0
)

interface BookRepository : JpaRepository<Book, String> {
    fun findByTitleContainingIgnoreCase(title: String, pageable: Pageable): Page<Book>
    fun findByUploadId(uploadId: String): Book?
}
