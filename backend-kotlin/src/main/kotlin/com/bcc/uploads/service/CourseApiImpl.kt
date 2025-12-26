package com.bcc.uploads.service

import com.bcc.course.CourseApi
import org.springframework.stereotype.Service

@Service
class CourseApiImpl : CourseApi {
    override fun isGeneratedContent(bookId: String, chapterId: String): Boolean {
        TODO("Not yet implemented")
    }

    override fun countGeneratedChaptersByBookId(bookId: String): Int {
        TODO("Not yet implemented")
    }
}