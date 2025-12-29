package com.bcc.uploads.service

import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.client.entity
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service

@Service
class BookTitleProvider(
    @param:Qualifier("fastChatClient") private val chatClient: ChatClient
) {
    private val log = LoggerFactory.getLogger(BookTitleProvider::class.java)

    fun getBookTitle(content: String): String {
        log.info("Starting title extraction")
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