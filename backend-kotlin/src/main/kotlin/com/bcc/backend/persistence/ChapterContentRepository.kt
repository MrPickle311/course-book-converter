package com.bcc.backend.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ChapterContentRepository : JpaRepository<ChapterContent, UUID> {
	fun findByBookIdAndChapterId(bookId: String, chapterId: String): ChapterContent?
}


