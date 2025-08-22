package com.bcc.backend.controller

import com.bcc.backend.dto.HealthResponse
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/health")
class HealthController(private val mongoTemplate: MongoTemplate) {
	@GetMapping("/")
	fun health(): ResponseEntity<HealthResponse> {
		val dbHealthy = try {
			mongoTemplate.db.runCommand(org.bson.Document("ping", 1))
			true
		} catch (ex: Exception) {
			false
		}
		val body = HealthResponse(
			status = if (dbHealthy) "healthy" else "degraded",
			message = "Book to Course Converter Backend is running",
			database = if (dbHealthy) "connected" else "disconnected",
			timestamp = Instant.now().toString()
		)
		return ResponseEntity.ok(body)
	}

	@GetMapping("/db")
	fun db(): ResponseEntity<Map<String, Any>> {
		return try {
			mongoTemplate.db.runCommand(org.bson.Document("ping", 1))
			val stats = mongoTemplate.db.runCommand(org.bson.Document("dbstats", 1))
			ResponseEntity.ok(
				mapOf(
					"status" to "connected",
					"database_name" to mongoTemplate.db.name,
					"collections" to (stats.get("collections") ?: 0),
					"objects" to (stats.get("objects") ?: 0),
					"data_size" to (stats.get("dataSize") ?: 0),
					"storage_size" to (stats.get("storageSize") ?: 0)
				)
			)
		} catch (ex: Exception) {
			ResponseEntity.ok(mapOf("status" to ("error"), "error" to (ex.message ?: "unknown")))
		}
	}
}
