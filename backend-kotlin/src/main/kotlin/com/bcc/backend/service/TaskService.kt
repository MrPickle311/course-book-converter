package com.bcc.backend.service

import com.bcc.api.model.ChapterTasksResponse
import com.bcc.api.model.TaskEvaluation
import com.bcc.backend.persistence.*
import com.bcc.backend.service.CourseGeneratorService.CourseTask
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import com.bcc.api.model.ChapterProgressData
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.model.Media
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

    private fun toApiEvaluation(ev: Evaluation?): TaskEvaluation? {
        if (ev == null) {
            return null
        }
        return TaskEvaluation()
            .isCorrect(ev.isCorrect)
            .mistakes(ev.mistakes ?: emptyList())
            .score(java.math.BigDecimal.valueOf(ev.score ?: 0.0))
    }

    fun getChapterTasks(uploadId: String, chapterId: String): ChapterTasksResponse {
        val defs = taskRepository.findByBookIdAndChapterId(uploadId, chapterId)
        val items = defs.map { def ->
            val definition = when (def.type) {
                "multiple-choice" -> {
                    val defObj: MultipleChoiceTaskDefinition? = def.definition?.let {
                        runCatching {
                            objectMapper.convertValue(
                                it,
                                MultipleChoiceTaskDefinition::class.java
                            )
                        }.getOrNull()
                    }
                    com.bcc.api.model.TaskDefinitionMultipleChoice()
                        .id(def.id.toString())
                        .type(com.bcc.api.model.TaskDefinitionMultipleChoice.TypeEnum.MULTIPLE_CHOICE)
                        .question(def.question)
                        .options((defObj?.options ?: emptyList()).map { o ->
                            com.bcc.api.model.TaskOption().id(o.id.toString()).label(o.label ?: "")
                        })
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
                        .options((defObj?.options ?: emptyList()).map { o ->
                            com.bcc.api.model.TaskOption().id(o.id.toString()).label(o.label ?: "")
                        })
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
                        .evaluation(toApiEvaluation(st?.evaluation))
                        .completed(st != null)
                }

                "multiple-select" -> {
                    val st: MultiselectTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultiselectTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userAnswers((st?.selectedOptions ?: emptyList()).map { it.id.toString() })
                        .evaluation(toApiEvaluation(st?.evaluation))
                        .completed(st != null)
                }

                "upload-pdf" -> {
                    val st: FileUploadTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, FileUploadTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userFileName(st?.fileName)
                        .evaluation(toApiEvaluation(st?.evaluation))
                        .completed(st != null)
                }

                else -> {
                    val st: ShortAnswerTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, ShortAnswerTaskState::class.java) }.getOrNull()
                    }
                    com.bcc.api.model.TaskState()
                        .userAnswer(st?.textAnswer)
                        .evaluation(toApiEvaluation(st?.evaluation))
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

    fun getChapterProgress(uploadId: String, chapterId: String): ChapterProgressData {
        val defs = taskRepository.findByBookIdAndChapterId(uploadId, chapterId)
        var completed = 0
        var failed = 0
        defs.forEach { def ->
            when (def.type) {
                "multiple-choice" -> {
                    val st: MultipleChoiceTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultipleChoiceTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) failed += 1
                    }
                }
                "multiple-select" -> {
                    val st: MultiselectTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultiselectTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) failed += 1
                    }
                }
                "upload-pdf" -> {
                    val st: FileUploadTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, FileUploadTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) failed += 1
                    }
                }
                else -> {
                    val st: ShortAnswerTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, ShortAnswerTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation.isCorrect == false) failed += 1
                    }
                }
            }
        }
        return ChapterProgressData()
            .tasksCount(defs.size)
            .tasksCompleted(completed)
            .tasksFailed(failed)
    }

    data class BookMetrics(
        val totalTasks: Int,
        val completedTasks: Int,
        val failedTasks: Int
    )

    fun computeBookMetrics(uploadId: String): BookMetrics {
        val tasks = taskRepository.findAllByBookId(uploadId)
        var completed = 0
        var failed = 0
        tasks.forEach { def ->
            when (def.type) {
                "multiple-choice" -> {
                    val st: MultipleChoiceTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultipleChoiceTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) failed += 1
                    }
                }
                "multiple-select" -> {
                    val st: MultiselectTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, MultiselectTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) failed += 1
                    }
                }
                "upload-pdf" -> {
                    val st: FileUploadTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, FileUploadTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) failed += 1
                    }
                }
                else -> {
                    val st: ShortAnswerTaskState? = def.state?.let {
                        runCatching { objectMapper.convertValue(it, ShortAnswerTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation.isCorrect == false) failed += 1
                    }
                }
            }
        }
        return BookMetrics(totalTasks = tasks.size, completedTasks = completed, failedTasks = failed)
    }

    fun persistTasks(uploadId: String, chapterId: String, tasks: List<CourseTask>): List<Task> {
        val book = bookRepository.findByUploadId(uploadId)
            ?: throw IllegalArgumentException("Book not found")
        val chapter = book.chapters.firstOrNull { it.id == chapterId }
            ?: throw IllegalArgumentException("Chapter not found")
        val definitions = tasks.mapIndexed { idx, t ->
            val type = mapType(t.type)
            val definitionObj: Any? = when (type) {
                "multiple-choice" -> {
                    val options = (t.options ?: emptyList()).map { label -> Option(label = label) }
                    val correct =
                        options.firstOrNull { it.label?.equals(t.correctAnswer ?: "", ignoreCase = true) == true }
                    MultipleChoiceTaskDefinition(options = options, correctOption = correct ?: Option())
                }

                "multiple-select" -> {
                    val options = (t.options ?: emptyList()).map { label -> Option(label = label) }
                    val correct = (t.correctAnswers ?: emptyList()).mapNotNull { ans ->
                        options.firstOrNull {
                            it.label?.equals(
                                ans,
                                ignoreCase = true
                            ) == true
                        }
                    }
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

    fun evaluateTextAnswer(question: String, answer: String, content: String, pdfMedia: Media): Evaluation {
        val system = SystemMessage(
            "You are a strict grader. " +
                    "Evaluate answer for correctness basing on given book's chapter. " +
                    "Chapter is attached as pdf media"
        )
        val user = UserMessage(
            "Question: \n$question\n\n" +
                    "Answer:\n$answer\n\n",
            pdfMedia
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

    fun updateMultipleChoice(taskId: String, selectedOptionId: String?): Evaluation {
        require(!selectedOptionId.isNullOrBlank()) { "selectedOptionId is required" }
        val uuid = java.util.UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        val def = objectMapper.convertValue(task.definition, MultipleChoiceTaskDefinition::class.java)
        val correctId = def.correctOption.id.toString()
        val isCorrect = selectedOptionId == correctId
        val evaluation = Evaluation(
            isCorrect = isCorrect,
            mistakes = if (isCorrect) emptyList() else listOf("Incorrect option selected"),
            score = if (isCorrect) 1.0 else 0.0
        )
        task.state = MultipleChoiceTaskState(
            selectedOption = Option(
                id = java.util.UUID.fromString(selectedOptionId),
                label = def.options.firstOrNull { it.id.toString() == selectedOptionId }?.label
            ),
            evaluation = evaluation
        )
        taskRepository.save(task)
        return evaluation
    }

    fun updateMultiSelect(taskId: String, selectedOptionIds: List<String>): Evaluation {
        val uuid = java.util.UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        val def = objectMapper.convertValue(task.definition, MultiselectTaskDefinition::class.java)
        val expected = def.correctOptions.map { it.id.toString() }
        val missing = expected.filterNot { selectedOptionIds.contains(it) }
        val extra = selectedOptionIds.filterNot { expected.contains(it) }
        val isCorrect = missing.isEmpty() && extra.isEmpty()
        val score = if (expected.isNotEmpty()) selectedOptionIds.count { expected.contains(it) }
            .toDouble() / expected.size else 0.0
        val evaluation = Evaluation(
            isCorrect = isCorrect,
            mistakes = buildList {
                if (missing.isNotEmpty()) add("Missing: ${missing.joinToString(", ")}")
                if (extra.isNotEmpty()) add("Extra: ${extra.joinToString(", ")}")
            },
            score = score
        )
        task.state = MultiselectTaskState(
            selectedOptions = selectedOptionIds.map { id ->
                val opt = def.options.firstOrNull { it.id.toString() == id }
                Option(id = java.util.UUID.fromString(id), label = opt?.label)
            },
            evaluation = evaluation
        )
        taskRepository.save(task)
        return evaluation
    }

    fun updateShortAnswer(taskId: String, textAnswer: String, pdfMedia: Media): Evaluation {
        val uuid = java.util.UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        val evaluation = evaluateTextAnswer(task.question, textAnswer, task.type, pdfMedia)
        task.state = ShortAnswerTaskState(textAnswer = textAnswer, evaluation = evaluation)
        taskRepository.save(task)
        return evaluation
    }

    fun updateFileUploadState(taskId: String, fileName: String, evaluation: Evaluation): Evaluation {
        val uuid = java.util.UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        task.state = FileUploadTaskState(fileName = fileName, evaluation = evaluation)
        taskRepository.save(task)
        return evaluation
    }
}


