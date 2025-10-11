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
import java.util.Objects
import java.util.UUID

@Entity
@Table(
    name = "task_definitions",
    indexes = [
        Index(name = "idx_taskdef_book_chapter", columnList = "book_id,chapter_id")
    ]
)
data class Task(

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    var id: UUID? = null,

    @Column(name = "book_id", nullable = false, length = 64)
    var bookId: String,

    @Column(name = "chapter_id", nullable = false, length = 128)
    var chapterId: String,

    @Column(name = "question", nullable = false, columnDefinition = "text")
    var question: String,

    @Column(name = "type", nullable = false, length = 64)
    var type: String,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Type(JsonType::class)
    @Column(name = "task_definition", columnDefinition = "jsonb")
    var definition: Object = null,

    @Column(name = "task_state", columnDefinition = "jsonb")
    var state: Object = null,
)

data class Option(
    var id: UUID = UUID.randomUUID(),
    var label: String? = null,
)

data class MultiselectTaskDefinition (
    var options: List<Option> = arrayListOf(),
    var correctOptions: List<Option> = arrayListOf(),
)

data class MultiselectTaskState (
    var selectedOptions: List<Option> = arrayListOf(),
)


data class MultipleChoiceTaskDefinition (
    var options: List<Option>,
    var correctOption: Option,
)

data class MultipleChoiceTaskState (
    var selectedOption: Option,
)

data class Evaluation(
    var isCorrect: Boolean,
    var mistakes: List<String>? = null,
    var score: Double? = null,
    var explanation: String? = null
)

data class ShortAnswerTaskState(
    var evaluation: Evaluation,
    var textAnswer: String? = null,
)

data class FileUploadTaskState(
    var evaluation: Evaluation,
    var fileName: String? = null
)

// remove it
data class TaskOptionData @JsonCreator constructor(
    @param:JsonProperty("id") val id: String,
    @param:JsonProperty("label") val label: String
)

interface TaskDefinitionRepository : JpaRepository<Task, UUID> {
    fun findByBookIdAndChapterId(bookId: String, chapterId: String): List<Task>
    fun findByTaskUid(taskUid: String): Task?
}


