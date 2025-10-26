package com.bcc.backend.service

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import org.apache.pdfbox.multipdf.PageExtractor
import org.apache.pdfbox.pdmodel.PDDocument
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.ChatClient.PromptUserSpec
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.model.Media
import org.springframework.core.io.ByteArrayResource
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.UrlResource
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.util.MimeTypeUtils
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Files
import java.util.*
import java.util.function.Consumer
import java.util.regex.Pattern
import kotlin.text.Charsets.UTF_8

fun addBasePathToImages(content: String, basePath: String): String {
    // Regex pattern to match Markdown images: ![alt text](image-path)
    val markdownImagePattern = """!\[([^\]]*)\]\(([^)]+)\)""".toRegex()

    return markdownImagePattern.replace(content) { matchResult ->
        val altText = matchResult.groupValues[1]
        val originalPath = matchResult.groupValues[2]

        // Skip if it's already an absolute URL (http://, https://, etc.)
        if (originalPath.matches("""^[a-zA-Z][a-zA-Z\d+\-.]*:""".toRegex())) {
            return@replace matchResult.value
        }

        val newPath = if (originalPath.startsWith("/")) {
            "$basePath$originalPath"
        } else {
            "$basePath/$originalPath"
        }

        // Reconstruct the Markdown image
        "![$altText]($newPath)"
    }
}

fun updateImageSourcesInPlace(filePath: String, basePath: String) {
    val file = File(filePath)
    val content = file.readText()
    val updatedContent = addBasePathToImages(content, basePath)
    file.writeText(updatedContent)
}

@Service
class UnexpectedTextRemover(builder: ChatClient.Builder) {
    private val logger = LoggerFactory.getLogger(UnexpectedTextRemover::class.java)
    private val chatClient = builder.build()

    fun removeUnexpectedText(markdownContent: String): String {

        val system = SystemMessage(
            "You are an expert of markdown's files. " +
                    "Your task is to postprocess and cleanup this markdown content. " +
                    "This markdown file contains notes from book's chapter. " +
                    "Please remove all wierd whitespace characters, weird text that messes up this markdown file. " +
                    "Examples what should be removed: whitespace characters that are repeated many times, " +
                    "non-whitespace characters that are repeated a huge amount of times without any sense. " +
                    "Don't touch meritoric information of this content. Remove only textual noise. " +
                    "Give me only cleaned up markdown content, nothing else. "
        )
        val user = UserMessage(
            buildString {
                append("Markdown content:\n${markdownContent}")
            }
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .chatResponse().result.output.content
    }
}

@Service
class MarkdownFormatFixer(builder: ChatClient.Builder) {
    private val logger = LoggerFactory.getLogger(UnexpectedTextRemover::class.java)
    private val chatClient = builder.build()

    private fun isMarkdownCorrect(markdownContent: String): Boolean {
        //TODO: add mardkown compilation logic
        return true;
    }

    fun fixMarkdownFormat(markdownContent: String): String {
        var isFixed = isMarkdownCorrect(markdownContent);
        var newMarkdownContent = markdownContent
        while (!isFixed) {
            newMarkdownContent = fixMarkdown(newMarkdownContent);
            isFixed = isMarkdownCorrect(newMarkdownContent);
        }

        return newMarkdownContent;

    }

    private fun fixMarkdown(markdownContent: String): String {
        val system = SystemMessage(
            "You are an expert of markdown's files. " +
                    "Your task is to fix this markdown content. " +
                    "This markdown file contains notes from book's chapter. " +
                    "This file is not valid, fix it. Find an issue and provide fixed version of this markdown content. " +
                    "Provide entire fixed markdown file, not only a part of it. " +
                    "Don't touch meritoric information of this content. "
        )
        val user = UserMessage(
            buildString {
                append("Markdown content:\n${markdownContent}")
            }
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .chatResponse().result.output.content
    }
}

@Service
class ImageFilterService(builder: ChatClient.Builder) {
    private val chatClient: ChatClient

    init {
        this.chatClient = builder.build()
    }

    fun filterMarkdownImages(basePath: String, markdownContent: String): String {
        val regex = """!\[([^\]]*)\]\(([^)]+)\)""".toRegex()
        var result = markdownContent

        regex.findAll(markdownContent)
            .map { it.groupValues }
            .filter { !isRelevantImage(it[2], basePath, markdownContent) }
            .forEach { result = result.replace(Regex.escape(it[0]), "") }

        return result
    }

    private fun isRelevantImage(imageUrl: String, basePath: String, content: String): Boolean {
        val img = imageUrl.split("/").last()
        println("Checking filtering image: $img")
        val prompt = """
            Analyze this image. Is it substantive content (diagram, photo, illustration) 
            or is it just a non related or trash element (icon, button, tip marker, decoration)?
            Answer only: RELEVANT or IRRELEVANT
            
            Here is markdown content:
            ${content}
            """.trimIndent()

        val response = chatClient.prompt()
            .user(Consumer { userSpec: PromptUserSpec? ->
                userSpec!!
                    .text(prompt)
                    .media(MimeTypeUtils.IMAGE_PNG, FileSystemResource(basePath + "/" + img))
            })
            .call()
            .content()

        println("Response for $img: $response")
        return response.uppercase(Locale.getDefault()).equals("RELEVANT")
    }
}

@Service
class CourseGeneratorService(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build(),
    private val imageFilterService: ImageFilterService
) {
    private val logger = LoggerFactory.getLogger(CourseGeneratorService::class.java)

    data class CourseTask @JsonCreator constructor(
        @param:JsonProperty("type") val type: String,
        @param:JsonProperty("title") val title: String,
        @param:JsonProperty("description") val description: String,
        @param:JsonProperty("options") val options: List<String>? = null,
        @param:JsonProperty("correctAnswer") val correctAnswer: String? = null,
        @param:JsonProperty("correctAnswers") val correctAnswers: List<String>? = null,
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
        @param:JsonProperty("context") val media: Media?
    )

    fun generateNotesMdxFromChapter(req: GenerateCourseRequest): String {
        val example = CourseGeneratorService::class.java.classLoader.getResourceAsStream("example.md").readAllBytes()
            .toString(UTF_8)
        val system = SystemMessage(
            "You are an expert notes writer. " +
                    "Now please, create detailed mardkown notes for this chapter. Extract all important information, all tips, all images, all code snippets with description. " +
                    "Instead of images there are urls for images, if you encounter this link then put this link into markdown doc. You can open it to see this image. " +
                    "Images should be named with pattern 'figure-<img_nmbr>.png' where img_nmbr is number of image in given chapter. Don't include chapter number into figure name. Valid examples: figure-1.png, figure-2.png, figure-12.png. " +
                    "Figures counting starts from 1 not 0. " +
                    "Invalid iamge name examples: figure-4-1.png, figure-1-1.png. " +
                    "Remember that image database contains all images from figure-1.png to figure-<end>.png from this chapter. " +
//                    "Remove unrelated/random images like images close to tips in book. But when you remove this image remember about incrementing counter, because I extract all images (even unrelated) to my database. " +
//                    "All braces ( { and} ) characters that are not within code block should be prependend with \\ " +
//                    "Here is example how image should look like in markdown file: <img src=\"figure-1.png\" alt=\"Figure 1: Image 1\" /> " +
                    "Here is an example of good quaility notes: \n" +
                    "${example}"
//                    "Rules: " +
//                    "(1) MDX must use headings, paragraphs and bullet lists; " +
//                    "(2) No code fences; " +
//                    "(3) No imports; " +
//                    "(4) Do not include images, only urls for them. "
        )
        val user = UserMessage(
            buildString {
                append("Chapter Title: \"${req.chapterTitle}\"\n")
            },
            req.media
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .chatResponse().result.output.content
    }

    fun generateTasksFromChapter(req: GenerateCourseRequest): List<CourseTask> {
        val system = SystemMessage(
            "You are an expert course designer. " +
                    "Create practice tasks for the chapter. " +
                    "Rules: type must be one of ['short-answer','multiple-choice','multiple-select','upload-pdf']; min 1, max 5 tasks; " +
                    "Each kind of task should appear at least one time. " +
                    "For multiple-choice provide options and correctAnswer. For multiple-select provide options and correctAnswers. " +
                    "For 'short-answer' create quite detailed question. "
        )
        val user = UserMessage(
            buildString {
                append("Chapter Title: \"${req.chapterTitle}\"\n")
            },
            req.media
        )
        val result = chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(TasksResult::class.java)
        println("Generated tasks: $result")
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
                    options = t.options?.take(12),
                    correctAnswer = t.correctAnswer,
                    correctAnswers = t.correctAnswers?.take(12)
                )
            }
        return normalized.ifEmpty {
            listOf(
                CourseTask(
                    type = "short-answer",
                    title = "Summarize the chapter",
                    description = "Write a concise summary."
                )
            )
        }
    }

    data class CourseModule(
        var notes: String,
        val tasks: List<CourseTask>
    )

    fun generateFromChapter(req: GenerateCourseRequest, basePath: String): CourseModule {
        var notes = generateNotesMdxFromChapter(req)
        val tasks = generateTasksFromChapter(req)
        return CourseModule(notes = notes, tasks = tasks)
    }

    fun subsetPdfAsMedia(
        originalPdf: File,
        startPageInclusive: Int,
        endPageInclusive: Int
    ): Media {
        require(startPageInclusive in 1..endPageInclusive) { "Invalid page range" }

        val baos = ByteArrayOutputStream()
        PDDocument.load(originalPdf).use { doc ->
            val subset = PageExtractor(doc, startPageInclusive, endPageInclusive).extract()
            subset.use { it.save(baos) }
        }
        return Media(MediaType.APPLICATION_PDF, ByteArrayResource(baos.toByteArray()))
    }
}
