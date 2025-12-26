package com.bcc.course.event

import com.bcc.book.Chapter

data class CourseCreationStartedEvent (
    val uploadId: String,
    val chapter: Chapter
)