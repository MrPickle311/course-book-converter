package com.bcc.backend.persistence

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository

interface BookRepository : JpaRepository<Book, String> {
	fun findByTitleContainingIgnoreCase(title: String, pageable: Pageable): Page<Book>
}


