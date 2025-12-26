package com.bcc.task.spi

import com.bcc.api.model.ProgressData
import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonProperty
import org.springframework.modulith.NamedInterface
import org.springframework.modulith.PackageInfo
import java.util.*

data class TasksMetrics(
    val totalTasks: Int,
    val completedTasks: Int,
    val failedTasks: Int
)

data class CourseTaskDto @JsonCreator constructor(
    @param:JsonProperty("type") val type: String,
    @param:JsonProperty("title") val title: String,
    @param:JsonProperty("options") val options: List<String>? = null,
    @param:JsonProperty("correctAnswer") val correctAnswer: String? = null,
    @param:JsonProperty("correctAnswers") val correctAnswers: List<String>? = null
)

interface TasksApi {
    fun computeBookMetrics(bookId: String): TasksMetrics
    fun deleteTasksByBookId(bookId: String): List<UUID>
    fun getChapterProgress(bookId: String, chapterId: String): ProgressData?
}
@PackageInfo
@NamedInterface("spi")
class ModuleMetadata {}
