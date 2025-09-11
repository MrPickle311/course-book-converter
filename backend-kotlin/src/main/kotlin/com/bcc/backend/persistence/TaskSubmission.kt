package com.bcc.backend.persistence

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("task_submissions")
data class TaskSubmission(
	@Id
	var id: String? = null,
	var taskId: String,
	var userId: String? = null,
	var type: String,
	var selectedOption: String? = null,
	var selectedOptions: List<String>? = null,
	var textAnswer: String? = null,
	var fileName: String? = null,
	var createdAt: Instant = Instant.now(),
	var evaluation: Evaluation? = null
)

data class Evaluation(
	var isCorrect: Boolean? = null,
	var mistakes: List<String>? = null,
	var score: Double? = null,
	var explanation: String? = null
)


