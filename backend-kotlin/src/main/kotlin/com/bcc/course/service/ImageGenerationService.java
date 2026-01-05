package com.bcc.course.service;


import com.google.common.collect.ImmutableList;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.springframework.ai.content.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ImageGenerationService {

    private final String imageGenerationModel = "gemini-3-pro-image-preview";

    private final Client genaiClient;

    public ImageGenerationService(@Value("${spring.ai.google.genai.api-key}") String apiKey) {
        this.genaiClient = Client.builder()
                .apiKey(apiKey)
                .build();
    }

    public Image generateImage(String imageName, String prompt, Media chapter) {
        List<Part> parts = new ArrayList<>();
        parts.add(Part.fromText(prompt)); // Add prompt
        parts.add(Part.fromBytes(chapter.getDataAsByteArray(), chapter.getMimeType().toString()));

        Content content = Content.builder()
                .parts(parts)
                .build();
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseModalities(List.of("Text", "Image"))
                .build();

        GenerateContentResponse response = this.genaiClient.models.generateContent(imageGenerationModel, content, config);
        return getImage(imageName, response);

    }

    private Image getImage(String imageName, GenerateContentResponse response) {
        ImmutableList<Part> responseParts = response.parts();
        if (responseParts == null || responseParts.isEmpty()) {
            return null;
        }

        Part part =  responseParts.getFirst();

        if (part.inlineData().isPresent() && part.inlineData().get().data().isPresent()){
            return new Image(
                    imageName,
                    part.inlineData().get().data().get()
            );
        }

        return null;
    }

    record Image(String imageName, byte[] imageBytes) {
    }
}