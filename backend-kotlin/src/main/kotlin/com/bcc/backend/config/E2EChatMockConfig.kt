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

        // Notes generation (rich markdown for e2e assertions)
        if (allText.contains("expert notes writer", ignoreCase = true) ||
            allText.contains("create detailed mardkown notes", ignoreCase = true)) {
            val title = extractTitle(allText)
            return """
            # ${title.ifBlank { "Chapter" }}

            This paragraph contains **bold**, _italic_, and `inlineCode()` text.

            > Blockquote line for emphasis

            ## Key Points

            - Item A
            - Item B
            - Item C

            ## Steps

            1. Step one
            2. Step two

            ## Code

            ```ts
            function add(a: number, b: number) {
              return a + b;
            }
            console.log(add(2, 3));
            ```

            ## Table

            | Feature | Value |
            | --- | --- |
            | Speed | Fast |
            | Size | Small |

            ## Image
            ![Figure 1](figure-1.png)

            ---
            Reference: [OpenAI](https://openai.com)
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
              {"type":"short-answer","title":"Summarize the chapter"},
              {"type":"multiple-choice","title":"Choose the correct option","options":["A","B","C"],"correctAnswer":"A"},
              {"type":"multiple-select","title":"Select valid items","options":["X","Y","Z"],"correctAnswers":["X","Z"]},
              {"type": "upload-pdf", "title":"Provide a pdf file with solution."}
            ]}
            """.trimIndent()
        }

        // Evaluation (JSON)
        if (allText.contains("strict grader", ignoreCase = true) || allText.contains("Evaluate answer", ignoreCase = true)) {
            // Allow forcing incorrect outcome during E2E to exercise Retake flows.
            // Trigger by including one of the markers in the user's answer or context.
            val forceIncorrect = allText.contains("[FORCE_INCORRECT]", ignoreCase = true)
                    || allText.contains("__INCORRECT__", ignoreCase = true)
                    || allText.contains("force incorrect", ignoreCase = true)
                    || allText.contains("wrong", ignoreCase = true)
            return if (forceIncorrect) {
                """
                {"isCorrect":false,"mistakes":["Forced incorrect","Please re-read the chapter","Answer lacks key points"],"score":0.0}
                """.trimIndent()
            } else {
                """
                {"isCorrect":true,"mistakes":[],"score":1.0,"explanation":"Mock evaluation"}
                """.trimIndent()
            }
        }

        return "OK"
    }

    private fun extractTitle(text: String): String {
        val re = Regex("Chapter Title: \"(.*?)\"")
        return re.find(text)?.groupValues?.getOrNull(1) ?: ""
    }
}


