package com.bcc.backend.persistence

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.mongodb.repository.MongoRepository

interface BookRepository : MongoRepository<Book, String> {
	fun findByTitleRegex(regex: String, pageable: Pageable): Page<Book>
}


