package com.bcc.backend.persistence

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant
import java.time.LocalDate

@Document("books")
data class Book(
	@Id
	var id: String, // uploadId
	var title: String,
	var uploadDate: LocalDate,
	var lastUsedAt: Instant? = null,
	var tableOfContents: List<TocItem> = emptyList(),
	var pageCount: Int = 0,
	var wordCount: Int = 0,
	var structuredCounts: Map<String, Int> = emptyMap(),
	var images: Int = 0,
	var tables: Int = 0,
	var cleanText: CleanText? = null
)

data class TocItem(
	var id: String? = null,
	var title: String = "",
	var page: Int = 0,
	var hasSubchapters: Boolean = false,
	var subchapters: List<TocItem> = emptyList()
)

data class CleanText(
	var wordCount: Int = 0,
	var removedElements: List<String> = emptyList()
)


