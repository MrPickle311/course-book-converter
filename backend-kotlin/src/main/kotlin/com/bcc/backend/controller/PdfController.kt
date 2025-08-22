package com.bcc.backend.controller

import com.bcc.backend.service.PdfProcessor
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.util.*

@RestController
@RequestMapping("/api/v1/pdf")
class PdfController(private val pdfProcessor: PdfProcessor) {
	private val logger = LoggerFactory.getLogger(PdfController::class.java)

	@PostMapping("/process", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
	fun process(@RequestPart("file") file: MultipartFile): ResponseEntity<Map<String, Any>> {
		val name = (file.originalFilename ?: "upload.pdf").lowercase()
		if (!name.endsWith(".pdf")) {
			return ResponseEntity.badRequest().body(mapOf(
				"success" to false,
				"message" to "Only PDF files are supported"
			))
		}
		val tmp = Files.createTempFile("upload-" + UUID.randomUUID(), ".pdf").toFile()
		return try {
			file.inputStream.use { input ->
				Files.copy(input, tmp.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING)
			}
			val res = pdfProcessor.process(tmp)
			ResponseEntity.ok(
				mapOf(
					"success" to true,
					"message" to "PDF processed successfully",
					"data" to mapOf(
						"pageCount" to res.pageCount,
						"wordCount" to res.wordCount,
						"chapters" to res.chapters.map {
							mapOf(
								"title" to it.title,
								"level" to it.level,
								"startPage" to it.startPage,
								"endPage" to it.endPage
							)
						},
						"structuredCounts" to res.structuredCounts,
						"images" to res.images,
						"tables" to res.tables,
						"toc" to res.toc,
						"cleanText" to res.cleanText
					)
				)
			)
		} catch (ex: Exception) {
			logger.error("Failed to process PDF", ex)
			ResponseEntity.internalServerError().body(
				mapOf(
					"success" to false,
					"message" to ("Failed to process PDF: ${ex.message}")
				)
			)
		} finally {
			try { tmp.delete() } catch (_: Exception) {}
		}
	}
}
