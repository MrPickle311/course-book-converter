package com.bcc.backend.controller

import com.bcc.backend.service.CourseGeneratorService
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.nio.file.Path

data class GenerateCourseRequest(
    val chapterTitle: String,
    val uploadId: String,
    val startPage: Int = 0,
    val endPage: Int? = null
)

@RestController
@RequestMapping("/api/v1/course")
class CourseController(private val courseGeneratorService: CourseGeneratorService) {

	@PostMapping("/generate")
	fun generate(@RequestBody body: GenerateCourseRequest): ResponseEntity<Any> {
		return try {
			val pdfPath = Path.of("uploads").resolve("${body.uploadId}.pdf").toFile()
			val context = extractPagesText(pdfPath, body.startPage, body.endPage)
			val module = courseGeneratorService.generateFromChapter(
                com.bcc.backend.service.GenerateCourseRequest(body.chapterTitle, context)
			)
			ResponseEntity.ok(mapOf("success" to true, "data" to module))
		} catch (ex: Exception) {
			ResponseEntity.internalServerError().body(mapOf("success" to false, "message" to ex.message))
		}
	}

	private fun extractPagesText(file: java.io.File, start: Int, end: Int?): String {
		PDDocument.load(file).use { doc ->
			val stripper = PDFTextStripper()
			stripper.startPage = start + 1 // PDFBox is 1-based
			stripper.endPage = (end ?: (doc.numberOfPages - 1)) + 1
			return stripper.getText(doc)
		}
	}
}
