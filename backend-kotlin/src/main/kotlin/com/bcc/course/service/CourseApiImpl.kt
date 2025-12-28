package com.bcc.course.service

import com.bcc.course.persistence.CourseRepository
import com.bcc.course.spi.CourseApi
import org.springframework.stereotype.Service

@Service
class CourseApiImpl(
    private val courseRepository: CourseRepository,
) : CourseApi {
    override fun isGeneratedContent(bookId: String, chapterId: String): Boolean {
        return courseRepository.findByBookIdAndChapterId(bookId, chapterId) != null
    }

    override fun countGeneratedChaptersByBookId(bookId: String): Int {
        return courseRepository.countByBookId(bookId).toInt()
    }
}