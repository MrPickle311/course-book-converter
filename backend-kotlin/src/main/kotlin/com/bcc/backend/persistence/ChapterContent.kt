package com.bcc.backend.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Lob
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "chapter_contents", indexes = [
	Index(name = "idx_chapter_content_book_chapter", columnList = "book_id,chapter_id")
])
data class ChapterContent(
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
	@Lob
	@Column(name = "content", nullable = false)
	var content: String,
	@Column(name = "created_at", nullable = false)
	var createdAt: Instant = Instant.now()
)


