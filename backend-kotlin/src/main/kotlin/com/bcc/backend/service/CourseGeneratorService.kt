package com.bcc.backend.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.stereotype.Service

data class CourseSection(
    val title: String,
    val summary: String,
    val keyConcepts: List<String>
)

data class CourseTask(
    val type: String,
    val title: String,
    val description: String,
    val successCriteria: List<String>
)

data class CourseModule(
    val title: String,
    val sections: List<CourseSection>,
    val tasks: List<CourseTask>
)

data class GenerateCourseRequest(
    val chapterTitle: String,
    val context: String? = null
)

@Service
class CourseGeneratorService(private val chatModel: ChatModel) {
	private val logger = LoggerFactory.getLogger(CourseGeneratorService::class.java)
	private val mapper = ObjectMapper()

	fun generateFromChapter(req: GenerateCourseRequest): CourseModule {
		val system = SystemMessage(
			"You are an expert course designer. Create a compact, high-quality course module " +
			"from the given book chapter. Respond with STRICT JSON using the schema: " +
			"{title:string, sections:[{title:string, summary:string, keyConcepts:string[]}], " +
			"tasks:[{type:string, title:string, description:string, successCriteria:string[]}]} . " +
			"No markdown or commentary."
		)
		val user = UserMessage(
			buildString {
				append("Chapter Title: \"${req.chapterTitle}\"\n")
				if (!req.context.isNullOrBlank()) {
					append("Context (optional excerpt):\n")
					append(req.context.take(4000))
				}
			}
		)
		val response = chatModel.call(Prompt(listOf(system, user)))
		val raw = response.result.output.content
		val json = extractJson(raw)
		val root: JsonNode = mapper.readTree(json)
		fun arr(n: JsonNode, name: String) = n.path(name).takeIf { it.isArray } ?: mapper.createArrayNode()
		val sections = arr(root, "sections").map { s ->
			CourseSection(
				title = s.path("title").asText("").trim(),
				summary = s.path("summary").asText("").trim(),
				keyConcepts = arr(s, "keyConcepts").map { it.asText("") }.filter { it.isNotBlank() }
			)
		}
		val tasks = arr(root, "tasks").map { t ->
			CourseTask(
				type = t.path("type").asText("").trim(),
				title = t.path("title").asText("").trim(),
				description = t.path("description").asText("").trim(),
				successCriteria = arr(t, "successCriteria").map { it.asText("") }.filter { it.isNotBlank() }
			)
		}
		return CourseModule(
			title = root.path("title").asText(req.chapterTitle).trim(),
			sections = sections,
			tasks = tasks
		)
	}

	private fun extractJson(text: String): String {
		val trimmed = text.trim()
		if (trimmed.startsWith("```")) {
			val fence = "```"
			val first = trimmed.indexOf(fence)
			val last = trimmed.lastIndexOf(fence)
			if (first >= 0 && last > first) {
				val inner = trimmed.substring(first + fence.length, last).trim()
				val newline = inner.indexOf('\n')
				return if (newline > 0) inner.substring(newline + 1).trim() else inner
			}
		}
		val start = trimmed.indexOf('{')
		val end = trimmed.lastIndexOf('}')
		if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1)
        }
		logger.debug("CourseGeneratorService.extractJson: returning raw content")
		return trimmed
	}
}
