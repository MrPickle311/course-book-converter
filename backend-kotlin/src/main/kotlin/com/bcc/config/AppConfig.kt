package com.bcc.config

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.google.genai.Client
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.google.genai.GoogleGenAiChatModel
import org.springframework.ai.google.genai.GoogleGenAiChatOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter


@Configuration
class AppConfig(private val appProperties: AppProperties) {
    @Bean
    fun corsFilter(): CorsFilter {
        val config = CorsConfiguration()
        config.allowedOrigins = appProperties.allowedOrigins
        config.addAllowedHeader("*")
        config.addAllowedMethod("*")
        config.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return CorsFilter(source)
    }

    @Bean
    @Primary
    fun objectMapper(): ObjectMapper {
        return ObjectMapper()
            .registerModule(KotlinModule.Builder().build())
            .configure(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT, true)
    }

    @Bean("fastChatClient")
    fun fastChatClient(
        @Value("\${spring.ai.google.genai.api-key}") apiKey: String,
        @Value("spring.ai.google.genai.location") location: String,
        @Value("spring.ai.google.genai.project-id") project: String,
    ): ChatClient {
        val genAiClient: Client? = Client.builder()
            .apiKey(apiKey)
            .build()

        val model =  GoogleGenAiChatModel.builder()
            .genAiClient(genAiClient)
            .defaultOptions(GoogleGenAiChatOptions.builder()
                .model("gemini-3-flash-preview")
                .build())
            .build()

        return ChatClient.builder(model).build()
    }
}
