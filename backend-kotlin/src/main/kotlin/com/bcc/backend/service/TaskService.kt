package com.bcc.backend.service

import com.bcc.api.model.ChapterTasksResponse
import com.bcc.api.model.TaskEvaluation
import com.bcc.backend.persistence.*
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.stereotype.Service

@Service
class TaskService(
    private val chatClientBuilder: ChatClient.Builder,
    private val courseGeneratorService: CourseGeneratorService,
    private val bookRepository: BookRepository,
    private val chapterContentRepository: ChapterContentRepository,
    private val taskRepository: TaskRepository,
    private val chatClient: ChatClient = chatClientBuilder.build(),
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(TaskService::class.java)

    fun getOrCreateTasks(uploadId: String, chapterId: String): ChapterTasksResponse {
        val defs = taskRepository.findByBookIdAndChapterId(uploadId, chapterId)
        val definitions = if (defs.isNotEmpty()) defs else generateAndPersist(uploadId, chapterId)
        val items = definitions.map { def ->
            val definition = when (def.type) {
                "multiple-choice" -> {
                    val defObj: MultipleChoiceTaskDefinition? = def.definition?.let {
                        runCatching { objectMapper.convertValue(it, MultipleChoiceTaskDefinition::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskDefinitionMultipleChoice()
                        .id(def.id.toString())
                        .type(com.bcc.api.model.TaskDefinitionMultipleChoice.TypeEnum.MULTIPLE_CHOICE)
                        .question(def.question)
                        .options((defObj?.options ?: emptyList()).map { o -> com.bcc.api.model.TaskOption().id(o.id.toString()).label(o.label ?: "") })
                        .correctAnswerId(defObj?.correctOption?.id?.toString())
                }
                "multiple-select" -> {
                    val defObj: MultiselectTaskDefinition? = def.definition?.let {
                        runCatching { objectMapper.convertValue(it, MultiselectTaskDefinition::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskDefinitionMultipleSelect()
                        .id(def.id.toString())
                        .type(com.bcc.api.model.TaskDefinitionMultipleSelect.TypeEnum.MULTIPLE_SELECT)
                        .question(def.question)
                        .options((defObj?.options ?: emptyList()).map { o -> com.bcc.api.model.TaskOption().id(o.id.toString()).label(o.label ?: "") })
                        .correctAnswerIds((defObj?.correctOptions ?: emptyList()).map { it.id.toString() })
                }
                "upload-pdf" -> com.bcc.api.model.TaskDefinitionUploadPdf()
                    .id(def.id.toString())
                    .type(com.bcc.api.model.TaskDefinitionUploadPdf.TypeEnum.UPLOAD_PDF)
                    .question(def.question)
                else -> com.bcc.api.model.TaskDefinitionShortAnswer()
                    .id(def.id.toString())
                    .type(com.bcc.api.model.TaskDefinitionShortAnswer.TypeEnum.SHORT_ANSWER)
                    .question(def.question)
            }
            val state = when (def.type) {
                "multiple-choice" -> {
                    val st: MultipleChoiceTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultipleChoiceTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userAnswer(st?.selectedOption?.id?.toString())
                        .evaluation(null)
                        .completed(st != null)
                }
                "multiple-select" -> {
                    val st: MultiselectTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultiselectTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userAnswers((st?.selectedOptions ?: emptyList()).map { it.id.toString() })
                        .evaluation(null)
                        .completed(st != null)
                }
                "upload-pdf" -> {
                    val st: FileUploadTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, FileUploadTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userFileName(st?.fileName)
                        .evaluation(st?.evaluation?.let { TaskEvaluation().isCorrect(it.isCorrect) })
                        .completed(st != null)
                }
                else -> {
                    val st: ShortAnswerTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, ShortAnswerTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userAnswer(st?.textAnswer)
                        .evaluation(st?.evaluation?.let { TaskEvaluation().isCorrect(it.isCorrect) })
                        .completed(st != null)
                }
            }
            com.bcc.api.model.TaskWithState()
                .definition(definition)
                .state(state)
        }
        return ChapterTasksResponse()
            .success(true)
            .tasks(items)
    }

    private fun generateAndPersist(uploadId: String, chapterId: String): List<Task> {
        val book = bookRepository.findByUploadId(uploadId)
            ?: throw IllegalArgumentException("Book not found")
        val chapter = book.chapters.firstOrNull { it.id == chapterId }
            ?: throw IllegalArgumentException("Chapter not found")

        val context = chapterContentRepository.findByBookIdAndChapterId(uploadId, chapterId)?.content
        val gen = courseGeneratorService.generateTasksFromChapter(
            CourseGeneratorService.GenerateCourseRequest(
                chapter.title,
                context
            )
        )
        val definitions = gen.mapIndexed { idx, t ->
            val type = mapType(t.type)
            val definitionObj: Any? = when (type) {
                "multiple-choice" -> {
                    val options = (t.options ?: emptyList()).map { label -> Option(label = label) }
                    val correct = options.firstOrNull { it.label?.equals(t.correctAnswer ?: "", ignoreCase = true) == true }
                    MultipleChoiceTaskDefinition(options = options, correctOption = correct ?: Option())
                }
                "multiple-select" -> {
                    val options = (t.options ?: emptyList()).map { label -> Option(label = label) }
                    val correct = (t.correctAnswers ?: emptyList()).mapNotNull { ans -> options.firstOrNull { it.label?.equals(ans, ignoreCase = true) == true } }
                    MultiselectTaskDefinition(options = options, correctOptions = correct)
                }
                else -> null
            }
            Task(
                bookId = uploadId,
                chapterId = chapterId,
                question = t.title,
                type = type,
                definition = definitionObj,
                state = null
            )
        }
        return taskRepository.saveAll(definitions)
    }

    private fun mapType(type: String): String = when (type.lowercase()) {
        "multiple-select" -> "multiple-select"
        "multiple-choice" -> "multiple-choice"
        "upload-pdf" -> "upload-pdf"
        else -> "short-answer"
    }

    fun evaluateTextWithChat(question: String, answer: String, type: String): Evaluation {
        val system = SystemMessage(
            "You are a strict grader. Evaluate student's answer for correctness and provide JSON {isCorrect:boolean, mistakes:string[], score:number, explanation:string}."
        )
        val user = UserMessage(
            "Question: \n$question\n\nStudent ${type} answer:\n$answer\n"
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(Evaluation::class.java)
    }

    fun evaluateChoicesWithChat(
        question: String,
        options: List<String>,
        selected: List<String>,
        correct: List<String>,
        multi: Boolean
    ): Evaluation {
        val system = SystemMessage(
            "You are a strict grader for ${if (multi) "multiple-select" else "multiple-choice"} tasks. " +
                "Evaluate the student's selection and return JSON {isCorrect:boolean, mistakes:string[], score:number, explanation:string}."
        )
        val user = UserMessage(
            buildString {
                append("Question: \n$question\n\n")
                append("Options: ${options.joinToString(" | ")}\n")
                append("Correct ${if (multi) "answers" else "answer"}: ${correct.joinToString(", ")}\n")
                append("Student selected: ${selected.joinToString(", ")}\n")
            }
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(Evaluation::class.java)
    }
}


