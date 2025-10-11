package com.bcc.backend.service

import com.bcc.api.model.ChapterTasksResponse
import com.bcc.api.model.TaskEvaluation
import com.bcc.backend.persistence.*
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
class TaskService(
    private val chatClientBuilder: ChatClient.Builder,
    private val courseGeneratorService: CourseGeneratorService,
    private val bookRepository: BookRepository,
    private val chapterContentRepository: ChapterContentRepository,
    private val taskDefinitionRepository: TaskDefinitionRepository,
    private val taskSubmissionRepository: TaskSubmissionRepository,
    private val chatClient: ChatClient = chatClientBuilder.build()
) {
    private val logger = LoggerFactory.getLogger(TaskService::class.java)

    fun getOrCreateTasks(uploadId: String, chapterId: String): ChapterTasksResponse {
        val defs = taskDefinitionRepository.findByBookIdAndChapterId(uploadId, chapterId)
        val definitions = if (defs.isNotEmpty()) defs else generateAndPersist(uploadId, chapterId)
        val items = definitions.map { def ->
            val latest = taskSubmissionRepository.findByTaskId(def.taskUid).maxByOrNull { it.createdAt }
            val apiEval = latest?.evaluation?.let { ev ->
                TaskEvaluation()
                    .isCorrect(ev.isCorrect == true)
                    .mistakes(ev.mistakes ?: emptyList())
                    .score(BigDecimal.valueOf(ev.score ?: 0.0))
                    .explanation(ev.explanation)
            }
            val definition = when (def.type) {
                "multiple-choice" -> com.bcc.api.model.TaskDefinitionMultipleChoice()
                    .id(def.taskUid)
                    .type(com.bcc.api.model.TaskDefinitionMultipleChoice.TypeEnum.MULTIPLE_CHOICE)
                    .question(def.question)
                    .options((def.options ?: emptyList()).map { o -> com.bcc.api.model.TaskOption().id(o.id).label(o.label) })
                    .correctAnswerId(def.correctAnswer)
                "multiple-select" -> com.bcc.api.model.TaskDefinitionMultipleSelect()
                    .id(def.taskUid)
                    .type(com.bcc.api.model.TaskDefinitionMultipleSelect.TypeEnum.MULTIPLE_SELECT)
                    .question(def.question)
                    .options((def.options ?: emptyList()).map { o -> com.bcc.api.model.TaskOption().id(o.id).label(o.label) })
                    .correctAnswerIds(def.correctAnswers)
                "upload-pdf" -> com.bcc.api.model.TaskDefinitionUploadPdf()
                    .id(def.taskUid)
                    .type(com.bcc.api.model.TaskDefinitionUploadPdf.TypeEnum.UPLOAD_PDF)
                    .question(def.question)
                else -> com.bcc.api.model.TaskDefinitionShortAnswer()
                    .id(def.taskUid)
                    .type(com.bcc.api.model.TaskDefinitionShortAnswer.TypeEnum.SHORT_ANSWER)
                    .question(def.question)
            }
            val state = com.bcc.api.model.TaskState()
                .userAnswer(latest?.textAnswer)
                .userAnswers(latest?.selectedOptions)
                .userFileName(latest?.fileName)
                .evaluation(apiEval)
                .completed(latest != null)
            com.bcc.api.model.TaskWithState()
                .definition(definition)
                .state(state)
        }
        return ChapterTasksResponse()
            .success(true)
            .tasks(items)
    }

    private fun generateAndPersist(uploadId: String, chapterId: String): List<TaskDefinition> {
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
            val optionItems = t.options?.mapIndexed { optIdx, label ->
                TaskOptionData(id = "opt-${idx + 1}-${optIdx + 1}", label = label)
            } ?: emptyList()
            val correctId: String? = t.correctAnswer?.let { ans ->
                optionItems.firstOrNull { it.label.equals(ans, ignoreCase = true) }?.id
            }
            val correctIds: List<String>? = t.correctAnswers?.mapNotNull { ans ->
                optionItems.firstOrNull { it.label.equals(ans, ignoreCase = true) }?.id
            }
            TaskDefinition(
                bookId = uploadId,
                chapterId = chapterId,
                taskUid = "task-$uploadId-$chapterId-${idx + 1}",
                question = t.title,
                type = mapType(t.type),
                options = optionItems,
                correctAnswer = correctId,
                correctAnswers = correctIds
            )
        }
        return taskDefinitionRepository.saveAll(definitions)
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


