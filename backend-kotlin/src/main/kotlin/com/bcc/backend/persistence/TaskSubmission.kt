package com.bcc.backend.persistence

import com.vladmihalcea.hibernate.type.json.JsonType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.Type
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "task_submissions")
data class TaskSubmission(
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	@Column(name = "id", updatable = false, nullable = false)
	var id: UUID? = null,
	@Column(name = "task_id", nullable = false)
	var taskId: String,
	@Column(name = "user_id")
	var userId: String? = null,
	@Column(name = "type", nullable = false)
	var type: String,
	@Type(JsonType::class)
	@Column(name = "selected_option", columnDefinition = "jsonb")
	var selectedOption: String? = null,
	@Type(JsonType::class)
	@Column(name = "selected_options", columnDefinition = "jsonb")
	var selectedOptions: List<String>? = null,
	@Type(JsonType::class)
	@Column(name = "text_answer", columnDefinition = "jsonb")
	var textAnswer: String? = null,
	@Column(name = "file_name")
	var fileName: String? = null,
	@Column(name = "created_at", nullable = false)
	var createdAt: Instant = Instant.now(),
	@Type(JsonType::class)
	@Column(name = "evaluation", columnDefinition = "jsonb")
	var evaluation: Evaluation? = null
)

data class Evaluation(
	var isCorrect: Boolean? = null,
	var mistakes: List<String>? = null,
	var score: Double? = null,
	var explanation: String? = null
)
