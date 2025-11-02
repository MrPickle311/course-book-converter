package com.bcc.backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.context.annotation.Profile
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.model.ChatResponse
import org.springframework.ai.chat.model.Generation
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.ai.chat.prompt.ChatOptions

@Configuration
@Profile("e2e")
class E2EChatMockConfig {

    @Bean
    @Primary
    fun e2eChatModel(): ChatModel {
        return object : ChatModel {
            override fun call(prompt: Prompt): ChatResponse {
                val content = buildMockResponse(prompt)
                val generation = Generation(AssistantMessage(content))
                return ChatResponse(listOf(generation))
            }

            override fun getDefaultOptions(): ChatOptions? = null
        }
    }

    @Bean
    @Primary
    fun e2eChatClientBuilder(model: ChatModel): ChatClient.Builder {
        return ChatClient.builder(model)
    }

    @Bean
    @Primary
    fun e2eChatClient(builder: ChatClient.Builder): ChatClient {
        return builder.build()
    }

    private fun buildMockResponse(prompt: Prompt): String {
        val allText = try {
            val f = prompt.javaClass.getDeclaredField("messages")
            f.isAccessible = true
            @Suppress("UNCHECKED_CAST")
            val msgs = f.get(prompt) as? List<Message>
            msgs?.joinToString("\n") { it.content ?: "" } ?: prompt.toString()
        } catch (_: Throwable) {
            prompt.toString()
        }

        // Image relevance check
        if (allText.contains("Analyze this image", ignoreCase = true)) {
            return "RELEVANT"
        }

        // Notes generation
        if (allText.contains("expert notes writer", ignoreCase = true) ||
            allText.contains("create detailed mardkown notes", ignoreCase = true)) {
            val title = extractTitle(allText)
            return """
            # ${title.ifBlank { "Chapter" }}

            - Key concepts overview
            - Important definitions
            - Practical tips

            ## Summary
            This is a deterministic e2e mock of generated notes for "$title".
            """.trimIndent()
        }

        // Table of contents extraction
        if (allText.contains("Extract ONLY top-level (root) Table of Contents", ignoreCase = true)) {
            return """
            {"complete":true,"items":[
              {"title":"Introduction","firstPage":1,"endPage":2},
              {"title":"Basics","firstPage":3,"endPage":6}
            ]}
            """.trimIndent()
        }

        // First relevant page detection
        if (allText.contains("first relevant page", ignoreCase = true)) {
            return """
            {"complete":true,"page":1}
            """.trimIndent()
        }

        // Tasks generation (JSON)
        if (allText.contains("expert course designer", ignoreCase = true)) {
            return """
            {"tasks":[
              {"type":"short-answer","title":"Summarize the chapter","description":"Write a concise summary."},
              {"type":"multiple-choice","title":"Choose the correct option","description":"Pick one","options":["A","B","C"],"correctAnswer":"A"},
              {"type":"multiple-select","title":"Select valid items","description":"Pick all that apply","options":["X","Y","Z"],"correctAnswers":["X","Z"]}
            ]}
            """.trimIndent()
        }

        // Evaluation (JSON)
        if (allText.contains("strict grader", ignoreCase = true) || allText.contains("Evaluate answer", ignoreCase = true)) {
            return """
            {"isCorrect":true,"mistakes":[],"score":1.0,"explanation":"Mock evaluation"}
            """.trimIndent()
        }

        return "OK"
    }

    private fun extractTitle(text: String): String {
        val re = Regex("Chapter Title: \"(.*?)\"")
        return re.find(text)?.groupValues?.getOrNull(1) ?: ""
    }
}


