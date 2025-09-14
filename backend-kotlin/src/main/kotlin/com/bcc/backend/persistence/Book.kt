package com.bcc.backend.persistence

import com.vladmihalcea.hibernate.type.json.JsonType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.Type
import java.time.Instant
import java.time.LocalDate

@Entity
@Table(name = "books")
data class Book(
    @Id
	@Column(name = "id", nullable = false, length = 64)
	var id: String, // uploadId
    @Column(name = "title", nullable = false)
	var title: String,
    @Column(name = "upload_date", nullable = false)
	var uploadDate: LocalDate,
    @Column(name = "last_used_at")
	var lastUsedAt: Instant? = null,
    @Type(JsonType::class)
	@Column(name = "table_of_contents", columnDefinition = "jsonb")
	var tableOfContents: List<TableOfContentItem> = emptyList(),
    @Column(name = "page_count", nullable = false)
	var pageCount: Int = 0,
    @Column(name = "word_count", nullable = false)
	var wordCount: Int = 0,
    @Type(JsonType::class)
	@Column(name = "structured_counts", columnDefinition = "jsonb")
	var structuredCounts: Map<String, Int> = emptyMap(),
    @Column(name = "images", nullable = false)
	var images: Int = 0,
    @Column(name = "tables", nullable = false)
	var tables: Int = 0,
    @Type(JsonType::class)
	@Column(name = "clean_text", columnDefinition = "jsonb")
	var cleanText: CleanText? = null
)

data class TableOfContentItem(
	var id: String? = null,
	var title: String = "",
	var page: Int = 0,
	var hasSubchapters: Boolean = false,
	var subchapters: List<TableOfContentItem> = emptyList()
)

data class CleanText(
	var wordCount: Int = 0,
	var removedElements: List<String> = emptyList()
)
