package com.bcc.config

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import com.google.genai.Client
import com.google.genai.types.GenerateContentResponse
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.google.genai.GoogleGenAiChatModel
import org.springframework.ai.google.genai.GoogleGenAiChatOptions
import org.springframework.ai.image.ImageGeneration
import org.springframework.ai.image.ImageModel
import org.springframework.ai.image.ImagePrompt
import org.springframework.ai.image.ImageResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.util.MimeType
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import java.util.*


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
    fun fastChatClient(@Value("\${spring.ai.google.genai.api-key}") apiKey: String): ChatClient {
        val genAiClient: Client? = Client.builder()
            .apiKey(apiKey)
            .build()

        val model = GoogleGenAiChatModel.builder()
            .genAiClient(genAiClient)
            .defaultOptions(
                GoogleGenAiChatOptions.builder()
                    .model("gemini-3-flash-preview")
                    .build()
            )
            .build()

        return ChatClient.builder(model).build()
    }

    @Bean("imageModel")
    fun imageModel(): ImageModel {
        return GeminiImageModel()
    }

    class GeminiImageModel : ImageModel {
        override fun call(request: ImagePrompt): ImageResponse {
            TODO()
//            return ImageResponse(listOf<ImageGeneration>());
        }

    }

    private fun getImages(response: GenerateContentResponse): MutableList<Image> {
        val responseParts = response.parts()
        if (responseParts == null || responseParts.isEmpty()) {
            return Collections.emptyList()
        }
        return responseParts
            .map { it.inlineData() }
            .filter { it.isPresent }
            .map { it.get() }
            .filter { it.data().isPresent }
            .map {
                Image(
                    "${UUID.randomUUID()}.${MimeType.valueOf(it.mimeType().get()).subtype}",
                    it.data().get(),  // imageBytes
                    MimeType.valueOf(it.mimeType().get()).toString()
                )
            }
            .toMutableList()
    }

    @JvmRecord
    data class Image(val imageName: String?, val imageBytes: ByteArray?, val mimeType: String?)
}
