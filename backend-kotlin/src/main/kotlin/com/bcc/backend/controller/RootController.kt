package com.bcc.backend.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class RootController {
	@GetMapping("/")
	fun root(): Map<String, Any?> = mapOf(
		"message" to "Book to Course Converter Backend",
		"version" to "0.1.0",
		"docs_url" to null,
		"health_check" to "/health"
	)
}
