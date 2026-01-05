package com.bcc.course.service

import com.bcc.uploads.spi.UploadsApi
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.ChatClient.PromptUserSpec
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.content.Media
import org.springframework.core.io.FileSystemResource
import org.springframework.stereotype.Service
import org.springframework.util.MimeTypeUtils
import java.util.*
import kotlin.text.Charsets.UTF_8

@Service
//TOOD: zobacz ParagraphPdfDocumentReader
class ImageFilterService(builder: ChatClient.Builder, private val uploadsApi: UploadsApi) {
    private val chatClient: ChatClient = builder.build()
    private val log = LoggerFactory.getLogger(ImageFilterService::class.java)

    fun filterMarkdownImages(uploadId: String, chapterId: String, markdownContent: String) {
        val imagesToRemove = uploadsApi.getImagesForChapter(uploadId, chapterId)
            .filter { !isRelevantImage(it, markdownContent) }
            .toList()
        uploadsApi.deleteImages(imagesToRemove)
    }

    private fun isRelevantImage(image: FileSystemResource, content: String): Boolean {
        log.info("Checking filtering image: ${image.path}")
        val prompt = """
            Analyze this image. Is it substantive content (diagram, photo, illustration) 
            or is it just a non related or trash element (icon, button, tip marker, decoration)?
            Answer only: RELEVANT or IRRELEVANT
            
            Here is markdown content:
            $content
            """.trimIndent()

        val response = chatClient.prompt()
            .user { userSpec: PromptUserSpec? ->
                userSpec!!
                    .text(prompt)
                    .media(MimeTypeUtils.IMAGE_PNG, image)
            }
            .call()
            .content()

        log.info("Response for ${image.path}: $response")
        return response?.uppercase(Locale.getDefault()) == "RELEVANT"
    }
}

@Service
class CourseGeneratorService(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build()
) {
    private val logger = LoggerFactory.getLogger(CourseGeneratorService::class.java)

    fun generateNotesForChapter(chapterTitle: String, chapterContent: Media): String {
        //TODO: move the sample notes getting to uploads
        logger.info("Started generating notes for $chapterTitle")
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
                append("Chapter Title: \"${chapterTitle}\"\n")
                append(chapterContent)
            }
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .chatResponse()!!.result.output.text ?: ""
    }
}

@Service
class MissingImagesResolver(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build()
){
    private val log = LoggerFactory.getLogger(MissingImagesResolver::class.java)

    fun getMissingImages(): List<String> {
        TODO()
    }

}
