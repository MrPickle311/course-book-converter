package com.bcc.backend.dto

data class HealthResponse(
	val status: String,
	val message: String,
	val database: String,
	val timestamp: String
)
