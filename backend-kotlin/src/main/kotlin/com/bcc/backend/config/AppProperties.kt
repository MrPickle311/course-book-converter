package com.bcc.backend.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
	var allowedOrigins: List<String> = listOf("http://localhost:3000", "http://localhost:5173"),
	var uploadDir: String = "./uploads",
	var pdfOcrEnabled: Boolean = false,
	var pdfOcrLanguage: String = "eng",
	var pdfExtractImages: Boolean = false,
	var pdfExtractTables: Boolean = false,
	var pdfDiscardTitles: List<String> = listOf(
		"foreword", "preface", "acknowledgments", "praise", "about the author", "copyright", "index"
	),
	var pdfDiscardBeforePage: Int = 1,
	var pdfTocTitleKeywords: List<String> = listOf("table of contents", "contents")
)
