package com.bcc.course.event

import com.bcc.book.spi.Chapter

data class CourseCreationStartedEvent (
    val uploadId: String,
    val chapter: Chapter
)