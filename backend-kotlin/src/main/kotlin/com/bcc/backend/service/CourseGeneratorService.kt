package com.bcc.backend.service

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
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

    data class CourseTask @JsonCreator constructor(
        @param:JsonProperty("type") val type: String,
        @param:JsonProperty("title") val title: String,
        @param:JsonProperty("description") val description: String,
        @param:JsonProperty("successCriteria") val successCriteria: List<String>
    )

    data class NotesResult @JsonCreator constructor(
        @param:JsonProperty("title") val title: String,
        @param:JsonProperty("mdx") val mdx: String
    )

    data class TasksResult @JsonCreator constructor(
        @param:JsonProperty("tasks") val tasks: List<CourseTask>
    )

    data class GenerateCourseRequest @JsonCreator constructor(
        @param:JsonProperty("chapterTitle") val chapterTitle: String,
        @param:JsonProperty("context") val context: String? = null
    )

    fun generateNotesMdxFromChapter(req: GenerateCourseRequest): NotesResult {
        val system = SystemMessage(
            "You are an expert course writer. Create compact high-quality MDX notes for the chapter. " +
                "Respond with STRICT JSON using: {title:string, mdx:string}. Rules: " +
                "(1) MDX must use headings, paragraphs and bullet lists; (2) No code fences; (3) No imports; " +
                "(4) Do not include images; (5) Keep concise and well-structured."
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
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(NotesResult::class.java)
    }

    fun generateTasksFromChapter(req: GenerateCourseRequest): List<CourseTask> {
        val system = SystemMessage(
            "You are an expert course designer. Create practice tasks for the chapter. " +
                "Respond with STRICT JSON using: {tasks:[{type:string, title:string, description:string, successCriteria:string[]}]} . " +
                "Rules: type must be one of ['short-answer','multiple-choice','multiple-select','code']; min 1, max 5 tasks; concise strings; no markdown."
        )
        val user = UserMessage(
            buildString {
                append("Chapter Title: \"${req.chapterTitle}\"\n")
                if (!req.context.isNullOrBlank()) {
                    append("Context (optional excerpt):\n")
                    append(req.context.take(3000))
                }
            }
        )
        val result = chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(TasksResult::class.java)
        // Basic normalization/fallbacks
        val normalized = result.tasks
            .map { t ->
                val type = when (t.type.lowercase()) {
                    "multiple-select" -> "multiple-select"
                    "multiple-choice" -> "multiple-choice"
                    "code" -> "code"
                    else -> "short-answer"
                }
                CourseTask(
                    type = type,
                    title = t.title.trim().ifBlank { "Practice question" },
                    description = t.description.trim(),
                    successCriteria = t.successCriteria.take(6)
                )
            }
            .take(5)
        return normalized.ifEmpty {
            listOf(
                CourseTask(
                    type = "short-answer",
                    title = "Summarize the chapter",
                    description = "Write a concise summary.",
                    successCriteria = listOf("Mentions key ideas")
                )
            )
        }
    }

    // Backwards-compat orchestration (not used by new flow)
    data class CourseModule(
        val notes: NotesResult,
        val tasks: List<CourseTask>
    )

    fun generateFromChapter(req: GenerateCourseRequest): CourseModule {
        val notes = generateNotesMdxFromChapter(req)
        val tasks = generateTasksFromChapter(req)
        return CourseModule(notes = notes , tasks = tasks)
    }

}
