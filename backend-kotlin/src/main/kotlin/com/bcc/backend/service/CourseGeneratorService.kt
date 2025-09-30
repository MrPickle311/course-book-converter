package com.bcc.backend.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.stereotype.Service

@Service
class CourseGeneratorService(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build()
) {
    private val logger = LoggerFactory.getLogger(CourseGeneratorService::class.java)
    private val mapper = ObjectMapper()

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
        val objectives: List<String>,
        val sections: List<CourseSection>,
        val tasks: List<CourseTask>
    )

    data class GenerateCourseRequest(
        val chapterTitle: String,
        val context: String? = null
    )

    fun generateFromChapter(req: GenerateCourseRequest): CourseModule {
        val system = SystemMessage(
            "You are an expert course designer. Create a compact, high-quality course module " +
                    "from the given book chapter. Respond with STRICT JSON using the schema: " +
                    "{title:string, objectives:string[], sections:[{title:string, summary:string, keyConcepts:string[]}], " +
                    "tasks:[{type:string, title:string, description:string, successCriteria:string[]}]} . " +
                    "Rules: (1) type must be one of ['short-answer','multiple-choice','multiple-select','code']; " +
                    "(2) 1-5 sections, 1-5 tasks; (3) keep strings concise; (4) no markdown; (5) avoid code fences."
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
        val raw = chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .content()
        val json = extractJson(raw)
        val root: JsonNode = mapper.readTree(json)
        fun arr(n: JsonNode, name: String) = n.path(name).takeIf { it.isArray } ?: mapper.createArrayNode()
        val objectives = arr(root, "objectives").map { it.asText("") }.filter { it.isNotBlank() }.take(7)
        fun normalizeTaskType(raw: String): String {
            val r = raw.lowercase()
            return when {
                r.contains("multiple") && r.contains("select") -> "multiple-select"
                r.contains("multiple") && r.contains("choice") -> "multiple-choice"
                r.contains("code") -> "code"
                else -> "short-answer"
            }
        }

        val sections = arr(root, "sections")
            .map { s ->
                CourseSection(
                    title = s.path("title").asText("").trim(),
                    summary = s.path("summary").asText("").trim(),
                    keyConcepts = arr(s, "keyConcepts").map { it.asText("") }.filter { it.isNotBlank() }.take(10)
                )
            }
            .filter { it.title.isNotBlank() || it.summary.isNotBlank() }
            .take(5)
        val tasks = arr(root, "tasks")
            .map { t ->
                CourseTask(
                    type = normalizeTaskType(t.path("type").asText("").trim()),
                    title = t.path("title").asText("").trim(),
                    description = t.path("description").asText("").trim(),
                    successCriteria = arr(t, "successCriteria").map { it.asText("") }.filter { it.isNotBlank() }.take(6)
                )
            }
            .filter { it.title.isNotBlank() }
            .take(5)
        val finalSections = if (sections.isEmpty()) listOf(
            CourseSection(title = req.chapterTitle, summary = "Overview of key concepts", keyConcepts = emptyList())
        ) else sections
        val finalTasks = if (tasks.isEmpty()) listOf(
            CourseTask(
                type = "short-answer",
                title = "Summarize the chapter",
                description = "Write a concise summary.",
                successCriteria = listOf("Mentions key ideas")
            )
        ) else tasks
        return CourseModule(
            title = root.path("title").asText(req.chapterTitle).trim().ifBlank { req.chapterTitle },
            objectives = objectives,
            sections = finalSections,
            tasks = finalTasks
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
        if (start >= 0 && end > start) return trimmed.substring(start, end + 1)
        logger.debug("CourseGeneratorService.extractJson: returning raw content")
        return trimmed
    }
}
