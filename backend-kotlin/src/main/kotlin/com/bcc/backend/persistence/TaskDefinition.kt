package com.bcc.backend.persistence

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.vladmihalcea.hibernate.type.json.JsonType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import org.hibernate.annotations.Type
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "task_definitions",
    indexes = [
        Index(name = "idx_taskdef_book_chapter", columnList = "book_id,chapter_id")
    ]
)
data class TaskDefinition(

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    var id: UUID? = null,

    @Column(name = "book_id", nullable = false, length = 64)
    var bookId: String,

    @Column(name = "chapter_id", nullable = false, length = 128)
    var chapterId: String,

    @Column(name = "task_uid", nullable = false, length = 256)
    var taskUid: String,

    @Column(name = "question", nullable = false, columnDefinition = "text")
    var question: String,

    @Column(name = "type", nullable = false, length = 64)
    var type: String,

    @Type(JsonType::class)
    @Column(name = "options", columnDefinition = "jsonb")
    var options: List<TaskOptionData>? = null,

    @Column(name = "correct_answer")
    var correctAnswer: String? = null,

    @Type(JsonType::class)
    @Column(name = "correct_answers", columnDefinition = "jsonb")
    var correctAnswers: List<String>? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)

data class TaskOptionData @JsonCreator constructor(
    @param:JsonProperty("id") val id: String,
    @param:JsonProperty("label") val label: String
)

interface TaskDefinitionRepository : JpaRepository<TaskDefinition, UUID> {
    fun findByBookIdAndChapterId(bookId: String, chapterId: String): List<TaskDefinition>
    fun findByTaskUid(taskUid: String): TaskDefinition?
}


