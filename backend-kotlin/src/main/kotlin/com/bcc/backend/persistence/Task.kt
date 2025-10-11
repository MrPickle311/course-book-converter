package com.bcc.backend.persistence

import com.vladmihalcea.hibernate.type.json.JsonType
import jakarta.persistence.*
import org.hibernate.annotations.Type
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

    @Type(JsonType::class)
    @Column(name = "task_definition", columnDefinition = "jsonb")
    var definition: Any? = null,

    @Type(JsonType::class)
    @Column(name = "task_state", columnDefinition = "jsonb")
    var state: Any? = null,
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

interface TaskRepository : JpaRepository<Task, UUID> {
    fun findByBookIdAndChapterId(bookId: String, chapterId: String): List<Task>
}


