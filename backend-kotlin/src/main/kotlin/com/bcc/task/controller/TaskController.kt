package com.bcc.task.controller

import com.bcc.api.TasksApi
import com.bcc.api.model.ChapterTasksResponse
import com.bcc.api.model.TaskEvaluation
import com.bcc.api.model.TaskSubmissionRequest
import com.bcc.api.model.TaskSubmissionResponse
import com.bcc.task.persistence.Evaluation
import com.bcc.task.service.TaskService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.math.BigDecimal

private const val DEFAULT_PDF_FILE_NAME = "upload.pdf"

private const val PDF_POSTFIX = ".pdf"

@RestController
class TaskController(
    private val taskService: TaskService
) : TasksApi {
    private val logger = LoggerFactory.getLogger(TaskController::class.java)

    override fun submitTask(
        taskId: String,
        taskSubmissionRequest: TaskSubmissionRequest
    ): ResponseEntity<TaskSubmissionResponse> {
        val evaluation = taskService.evaluateTask(taskSubmissionRequest, taskId) ?: return ResponseEntity.notFound().build()
        return buildTaskEvaluationResponse(evaluation)
    }

    override fun submitTaskFile(
        taskId: String,
        file: MultipartFile
    ): ResponseEntity<TaskSubmissionResponse> {
        val originalFileName = (file.originalFilename ?: DEFAULT_PDF_FILE_NAME).lowercase()
        val isPdf = originalFileName.endsWith(PDF_POSTFIX)
        if (!isPdf) {
            return getInvalidFileFormatResponse()
        }
        return try {
            val evaluation =
                taskService.evaluateTaskFile(file, taskId, originalFileName) ?: return ResponseEntity.notFound().build()
            buildTaskEvaluationResponse(evaluation)
        } catch (ex: Exception) {
            logger.error("Failed to store task file", ex)
            ResponseEntity.internalServerError().build()
        }
    }

    private fun buildTaskEvaluationResponse(evaluation: Evaluation): ResponseEntity<TaskSubmissionResponse> {
        val taskEvaluation = TaskEvaluation()
            .isCorrect(evaluation.isCorrect)
            .mistakes(evaluation.mistakes)
            .score(BigDecimal.valueOf(evaluation.score))
        val response = TaskSubmissionResponse().success(true).evaluation(taskEvaluation)
        return ResponseEntity.ok(response)
    }

    private fun getInvalidFileFormatResponse(): ResponseEntity<TaskSubmissionResponse> {
        val response = TaskEvaluation()
            .isCorrect(false)
            .mistakes(listOf("Only PDF files are supported"))
            .score(BigDecimal.valueOf(0.0))
        val resp = TaskSubmissionResponse()
            .success(true)
            .evaluation(response)
        return ResponseEntity.ok(resp)
    }

    override fun getChapterTasks(uploadId: String, chapterId: String): ResponseEntity<ChapterTasksResponse> {
        return try {
            val resp = taskService.getChapterTasks(uploadId, chapterId)
            ResponseEntity.ok(resp)
        } catch (ex: Exception) {
            logger.error("Failed to get chapter tasks for {}/{}", uploadId, chapterId, ex)
            ResponseEntity.internalServerError().build()
        }
    }

}
