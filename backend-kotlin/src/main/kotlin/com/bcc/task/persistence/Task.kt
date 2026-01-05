package com.bcc.task.persistence

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.*

@Entity
@Table(
    name = "tasks",
    indexes = [
        Index(name = "idx_tasks_book_chapter", columnList = "book_id,chapter_id")
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

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "task_definition", columnDefinition = "jsonb")
    var definition: Any? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "task_state", columnDefinition = "jsonb")
    var state: Any? = null,
)

data class Option @JsonCreator constructor(
    @param:JsonProperty("id") var id: UUID = UUID.randomUUID(),
    @param:JsonProperty("label") var label: String? = null,
)

data class MultiselectTaskDefinition @JsonCreator constructor(
    @param:JsonProperty("options") var options: List<Option> = arrayListOf(),
    @param:JsonProperty("correctOptions") var correctOptions: List<Option> = arrayListOf(),
)

data class MultiselectTaskState @JsonCreator constructor(
    @param:JsonProperty("selectedOptions") var selectedOptions: List<Option> = arrayListOf(),
    @param:JsonProperty("evaluation") var evaluation: Evaluation? = null,
)


data class MultipleChoiceTaskDefinition @JsonCreator constructor(
    @param:JsonProperty("options") var options: List<Option>,
    @param:JsonProperty("correctOption") var correctOption: Option,
)

data class MultipleChoiceTaskState @JsonCreator constructor(
    @param:JsonProperty("selectedOption") var selectedOption: Option,
    @param:JsonProperty("evaluation") var evaluation: Evaluation? = null,
)

data class Evaluation @JsonCreator constructor(
    @param:JsonProperty("isCorrect") var isCorrect: Boolean,
    @param:JsonProperty("mistakes") var mistakes: List<String> = emptyList(),
    @param:JsonProperty("score") var score: Double = 0.0
)

data class ShortAnswerTaskState @JsonCreator constructor(
    @param:JsonProperty("evaluation") var evaluation: Evaluation,
    @param:JsonProperty("textAnswer") var textAnswer: String? = null,
)

data class FileUploadTaskState @JsonCreator constructor(
    @param:JsonProperty var evaluation: Evaluation,
    @param:JsonProperty var fileName: String? = null
)

interface TaskRepository : JpaRepository<Task, UUID> {
    fun findByBookIdAndChapterId(bookId: String, chapterId: String): List<Task>
    fun deleteByBookId(bookId: String)
    fun findAllByBookId(bookId: String): MutableList<Task>
    fun deleteByBookIdAndChapterId(bookId: String, chapterId: String)
}


