package com.bcc.backend.persistence

import org.springframework.data.mongodb.repository.MongoRepository

interface TaskSubmissionRepository : MongoRepository<TaskSubmission, String> {
	fun findByTaskId(taskId: String): List<TaskSubmission>
}


