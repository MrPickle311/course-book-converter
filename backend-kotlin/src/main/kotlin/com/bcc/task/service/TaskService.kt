package com.bcc.task.service

import com.bcc.api.model.*
import com.bcc.task.persistence.*
import com.bcc.task.spi.CourseTaskDto
import com.bcc.task.spi.TasksApi
import com.bcc.task.spi.TasksMetrics
import com.bcc.uploads.spi.UploadsApi
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.content.Media
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.math.BigDecimal
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.*

@Service
class TaskService(
    private val chatClientBuilder: ChatClient.Builder,
    private val taskRepository: TaskRepository,
    private val chatClient: ChatClient = chatClientBuilder.build(),
    private val objectMapper: ObjectMapper = jacksonObjectMapper(),
    private val uploadsApi: UploadsApi
) : TasksApi {
    private val logger = LoggerFactory.getLogger(TaskService::class.java)

    private fun toApiEvaluation(ev: Evaluation?): TaskEvaluation? {
        if (ev == null) {
            return null
        }
        return TaskEvaluation()
            .isCorrect(ev.isCorrect)
            .mistakes(ev.mistakes)
            .score(BigDecimal.valueOf(ev.score))
    }

    fun getChapterTasks(uploadId: String, chapterId: String): ChapterTasksResponse {
        val tasks = taskRepository.findByBookIdAndChapterId(uploadId, chapterId)
        logger.info("Extracted tasks $tasks")
        val result = tasks.map { task ->
            val definition = when (task.type) {
                "multiple-choice" -> {
                    val defObj: MultipleChoiceTaskDefinition? = task.definition?.let {
                        runCatching {
                            objectMapper.readValue(
                                it as String,
                                MultipleChoiceTaskDefinition::class.java
                            )
                        }.getOrNull()
                    }
                    logger.info("Extracted definition $defObj")
                    TaskDefinitionMultipleChoice()
                        .id(task.id.toString())
                        .type(TaskDefinitionMultipleChoice.TypeEnum.MULTIPLE_CHOICE)
                        .question(task.question)
                        .options((defObj?.options ?: emptyList()).map { o ->
                            TaskOption().id(o.id.toString()).label(o.label ?: "")
                        })
                        .correctAnswerId(defObj?.correctOption?.id?.toString())
                }
                "multiple-select" -> {
                    val defObj: MultiselectTaskDefinition? = task.definition?.let {
                         objectMapper.readValue(it as String, MultiselectTaskDefinition::class.java)
                    }
                    logger.info("Extracted definition $defObj")
                    TaskDefinitionMultipleSelect()
                        .id(task.id.toString())
                        .type(TaskDefinitionMultipleSelect.TypeEnum.MULTIPLE_SELECT)
                        .question(task.question)
                        .options((defObj?.options ?: emptyList()).map { o ->
                            TaskOption().id(o.id.toString()).label(o.label ?: "")
                        })
                        .correctAnswerIds((defObj?.correctOptions ?: emptyList()).map { it.id.toString() })
                }
                "upload-pdf" -> TaskDefinitionUploadPdf()
                    .id(task.id.toString())
                    .type(TaskDefinitionUploadPdf.TypeEnum.UPLOAD_PDF)
                    .question(task.question)

                else -> TaskDefinitionShortAnswer()
                    .id(task.id.toString())
                    .type(TaskDefinitionShortAnswer.TypeEnum.SHORT_ANSWER)
                    .question(task.question)
            }
            val state = when (task.type) {
                "multiple-choice" -> {
                    val state: MultipleChoiceTaskState? = task.state?.let {
                        runCatching { objectMapper.readValue(it as String, MultipleChoiceTaskState::class.java) }.getOrNull()
                    }
                    logger.info("Extracted state $state")
                    TaskState()
                        .userAnswer(state?.selectedOption?.id?.toString())
                        .evaluation(toApiEvaluation(state?.evaluation))
                        .completed(state != null)
                }

                "multiple-select" -> {
                    val state: MultiselectTaskState? = task.state?.let {
                        runCatching { objectMapper.readValue(it as String, MultiselectTaskState::class.java) }.getOrNull()
                    }
                    logger.info("Extracted state $state")
                    TaskState()
                        .userAnswers((state?.selectedOptions ?: emptyList()).map { it.id.toString() })
                        .evaluation(toApiEvaluation(state?.evaluation))
                        .completed(state != null)
                }

                "upload-pdf" -> {
                    val state: FileUploadTaskState? = task.state?.let {
                        runCatching { objectMapper.readValue(it as String, FileUploadTaskState::class.java) }.getOrNull()
                    }
                    logger.info("Extracted state $state")
                    TaskState()
                        .userFileName(state?.fileName)
                        .evaluation(toApiEvaluation(state?.evaluation))
                        .completed(state != null)
                }

                else -> {
                    val state: ShortAnswerTaskState? = task.state?.let {
                        runCatching { objectMapper.readValue(it as String, ShortAnswerTaskState::class.java) }.getOrNull()
                    }
                    logger.info("Extracted state $state")
                    TaskState()
                        .userAnswer(state?.textAnswer)
                        .evaluation(toApiEvaluation(state?.evaluation))
                        .completed(state != null)
                }
            }
            TaskWithState()
                .definition(definition)
                .state(state)
        }
        return ChapterTasksResponse()
            .success(true)
            .tasks(result)
    }

    override fun getChapterProgress(uploadId: String, chapterId: String): ProgressData {
        val defs = taskRepository.findByBookIdAndChapterId(uploadId, chapterId)
        var completed = 0
        var failed = 0
        defs.forEach { def ->
            when (def.type) {
                "multiple-choice" -> {
                    val st: MultipleChoiceTaskState? = def.state?.let {
                        runCatching { objectMapper.readValue(it as String, MultipleChoiceTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) {
                            failed += 1
                        }
                    }
                }
                "multiple-select" -> {
                    val st: MultiselectTaskState? = def.state?.let {
                        runCatching { objectMapper.readValue(it as String, MultiselectTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (st.evaluation?.isCorrect == false) {
                            failed += 1
                        }
                    }
                }
                "upload-pdf" -> {
                    val st: FileUploadTaskState? = def.state?.let {
                        runCatching { objectMapper.readValue(it as String, FileUploadTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (!st.evaluation.isCorrect) {
                            failed += 1
                        }
                    }
                }
                else -> {
                    val st: ShortAnswerTaskState? = def.state?.let {
                        runCatching { objectMapper.readValue(it as String, ShortAnswerTaskState::class.java) }.getOrNull()
                    }
                    if (st != null) {
                        completed += 1
                        if (!st.evaluation.isCorrect) {
                            failed += 1
                        }
                    }
                }
            }
        }
        return ProgressData()
            .tasksCount(defs.size)
            .tasksCompleted(completed)
            .tasksFailed(failed)
    }

    fun findTask(taskId: String): Task = taskRepository.findById(UUID.fromString(taskId)).get()

    override fun computeBookMetrics(bookId: String): TasksMetrics {
        val tasks = taskRepository.findAllByBookId(bookId)
        val total = tasks.size
        val completed = tasks.count { it.state != null }
        val failed = tasks.count { task ->
            val state = task.state
            if (state is Map<*, *>) {
                val eval = state["evaluation"] as? Map<*, *>
                eval?.get("isCorrect") == false
            } else {
                false
            }
        }
        return TasksMetrics(total, completed, failed)
    }

    @Transactional
    override fun deleteTasksByBookId(bookId: String): List<UUID> {
        val tasks = taskRepository.findAllByBookId(bookId)
        val ids = tasks.mapNotNull { it.id }
        taskRepository.deleteByBookId(bookId)
        return ids
    }

    @Transactional
    fun deleteTasks(uploadId: String, chapterId: String): List<UUID> {
        val tasks = taskRepository.findByBookIdAndChapterId(uploadId, chapterId)
        val ids = tasks.mapNotNull { it.id }
        taskRepository.deleteByBookIdAndChapterId(uploadId, chapterId)
        return ids
    }

    fun persistTasks(uploadId: String, chapterId: String, tasks: List<CourseTaskDto>): List<Task> {
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
                    "Answer:\n$answer\n\n" +
            pdfMedia
        )
        return chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(Evaluation::class.java)!!
    }

    fun updateMultipleChoice(taskId: String, selectedOptionId: String?): Evaluation {
        require(!selectedOptionId.isNullOrBlank()) { "selectedOptionId is required" }
        val uuid = UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        val def = objectMapper.readValue(task.definition as String, MultipleChoiceTaskDefinition::class.java)
        val correctId = def.correctOption.id.toString()
        val isCorrect = selectedOptionId == correctId
        val evaluation = Evaluation(
            isCorrect = isCorrect,
            mistakes = if (isCorrect) emptyList() else listOf("Incorrect option selected"),
            score = if (isCorrect) 1.0 else 0.0
        )
        task.state = MultipleChoiceTaskState(
            selectedOption = Option(
                id = UUID.fromString(selectedOptionId),
                label = def.options.firstOrNull { it.id.toString() == selectedOptionId }?.label
            ),
            evaluation = evaluation
        )
        taskRepository.save(task)
        return evaluation
    }

    fun updateMultiSelect(taskId: String, selectedOptionIds: List<String>): Evaluation {
        val uuid = UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        val def = objectMapper.readValue(task.definition as String, MultiselectTaskDefinition::class.java)
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
                Option(id = UUID.fromString(id), label = opt?.label)
            },
            evaluation = evaluation
        )
        taskRepository.save(task)
        return evaluation
    }

    fun updateShortAnswer(taskId: String, textAnswer: String, pdfMedia: Media): Evaluation {
        val uuid = UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        val evaluation = evaluateTextAnswer(task.question, textAnswer, task.type, pdfMedia)
        task.state = ShortAnswerTaskState(textAnswer = textAnswer, evaluation = evaluation)
        taskRepository.save(task)
        return evaluation
    }

    fun updateFileUploadState(taskId: String, fileName: String, evaluation: Evaluation): Evaluation {
        val uuid = UUID.fromString(taskId)
        val task = taskRepository.findById(uuid).orElseThrow()
        task.state = FileUploadTaskState(fileName = fileName, evaluation = evaluation)
        taskRepository.save(task)
        return evaluation
    }


    private fun generateIdForTaskFileEvaluation(original: String): String =
        UUID.randomUUID().toString() + "-" + original

    fun evaluateTaskFile(
        file: MultipartFile,
        taskId: String,
        originalFileName: String
    ): Evaluation? {
        val uploadDir = getUploadDirectoryPath(taskId)
        createDirectoryForTask(uploadDir)
        val storedName = generateIdForTaskFileEvaluation(originalFileName)
        val dest = uploadDir.resolve(storedName)

        file.inputStream.use { input ->
            Files.copy(input, dest, StandardCopyOption.REPLACE_EXISTING)
        }
        val extractedText = extractText(dest)

        val task = findTask(taskId)
        val pdfMedia = uploadsApi.getChapterContent(task.bookId, task.chapterId) ?: return null

        val evaluation = evaluateTextAnswer(
            task.question,
            extractedText,
            "upload-pdf",
            pdfMedia
        )
        val persisted = updateFileUploadState(taskId, file.originalFilename ?: storedName, evaluation)
        return persisted
    }

    private fun createDirectoryForTask(uploadDir: Path) {
        Files.createDirectories(uploadDir)
    }


    private fun getUploadDirectoryPath(taskId: String): Path = Path.of("uploads", "tasks", taskId).toAbsolutePath()

    private fun extractText(dest: Path): String {
        return runCatching {
            PDDocument.load(dest.toFile()).use { doc ->
                val stripper = PDFTextStripper()
                stripper.getText(doc)
            }
        }.getOrElse { "" }
    }

    fun evaluateShortAnswerTask(
        taskId: String,
        textAnswer: String?
    ): Evaluation? {
        val txt = textAnswer?.trim() ?: ""
        val task = findTask(taskId)
        val pdfMedia = uploadsApi.getChapterContent(task.bookId, task.chapterId) ?: return null
        return updateShortAnswer(taskId, txt, pdfMedia)
    }

    fun evaluateTask(
        taskSubmissionRequest: TaskSubmissionRequest,
        taskId: String
    ): Evaluation? {
        val type = taskSubmissionRequest.type?.value ?: ""
        return when (type) {
            "multiple-choice" -> updateMultipleChoice(taskId, taskSubmissionRequest.selectedOptionId)
            "multiple-select" -> updateMultiSelect(taskId, taskSubmissionRequest.selectedOptionIds ?: emptyList())
            "short-answer" -> evaluateShortAnswerTask(taskId, taskSubmissionRequest.textAnswer)
            else -> Evaluation(
                isCorrect = false,
                mistakes = listOf("Unsupported task type: $type"),
                score = 0.0
            )
        }
    }

    data class TasksResult @JsonCreator constructor(
        @param:JsonProperty("tasks") val tasks: List<CourseTaskDto>
    )

    fun generateTasksFromChapter(chapterTitle: String, chapterContent: Media): List<CourseTaskDto> {
        val system = SystemMessage(
            "You are an expert course designer. " +
                    "Create practice tasks for the chapter. " +
                    "Rules: type must be one of ['short-answer','multiple-choice','multiple-select','upload-pdf']; min 1, max 5 tasks; " +
                    "Each kind of task should appear at least one time. " +
                    "Try to reuse tasks from this chapter if exsit. " +
                    "For multiple-choice provide options and correctAnswer. For multiple-select provide options and correctAnswers. " +
                    "For 'short-answer' create quite detailed question. "
        )
        val user = UserMessage(
            buildString {
                append("Chapter Title: \"${chapterTitle}\"\n")
                append(chapterContent)
            }
        )
        val result = chatClient
            .prompt()
            .messages(listOf(system, user))
            .call()
            .entity(TasksResult::class.java)
        println("Generated tasks: $result")
        val normalized = result!!.tasks
            .map { t ->
                val type = when (t.type.lowercase()) {
                    "multiple-select" -> "multiple-select"
                    "multiple-choice" -> "multiple-choice"
                    "short-answer" -> "short-answer"
                    else -> "upload-pdf"
                }
                CourseTaskDto(
                    type = type,
                    title = t.title.trim().ifBlank { "Practice question" },
                    options = t.options?.take(12),
                    correctAnswer = t.correctAnswer,
                    correctAnswers = t.correctAnswers?.take(12)
                )
            }
        return normalized.ifEmpty {
            listOf(
                CourseTaskDto(
                    type = "short-answer",
                    title = "Summarize the chapter"
                )
            )
        }
    }
}