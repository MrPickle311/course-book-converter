package com.bcc.uploads.service

import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.entity
import org.springframework.stereotype.Service

@Service
class BookTitleProvider(
    private val chatClientBuilder: ChatClient.Builder,
    private val chatClient: ChatClient = chatClientBuilder.build()
) {

    fun getBookTitle(content: String): String {
        val system = "Extract ONLY title of this book. Nothing else."
        val user = "I provided input as map<pageNumber,pageContentString>:\n\n${content}\n\n"
        return chatClient
            .prompt()
            .system(system)
            .user(user)
            .call()
            .entity<String>()
    }
}