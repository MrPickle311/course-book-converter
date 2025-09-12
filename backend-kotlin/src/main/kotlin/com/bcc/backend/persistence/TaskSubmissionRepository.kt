package com.bcc.backend.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TaskSubmissionRepository : JpaRepository<TaskSubmission, UUID> {
	fun findByTaskId(taskId: String): List<TaskSubmission>
}


