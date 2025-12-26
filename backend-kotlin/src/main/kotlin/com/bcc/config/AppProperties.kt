package com.bcc.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
	var allowedOrigins: List<String> = listOf("http://localhost:3000", "http://localhost:5173"),
)