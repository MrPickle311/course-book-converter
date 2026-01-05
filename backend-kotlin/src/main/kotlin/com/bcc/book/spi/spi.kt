package com.bcc.book.spi

import org.springframework.modulith.NamedInterface
import org.springframework.modulith.PackageInfo
import java.util.*

enum class ChapterStatus(value: String) {
    NOT_GENERATED("NOT_GENERATED"),
    GENERATING("GENERATING"),
    GENERATED("GENERATED")
}

data class Chapter(
    var id: String = UUID.randomUUID().toString(),
    var title: String,
    var startPage: Int = 0,
    var endPage: Int = 0,
    var chapterStatus: ChapterStatus
)

data class BookDeletedEvent(val id: String)

interface BooksApi {
    fun getChapter(chapterId: String): Chapter?

}

@PackageInfo
@NamedInterface("spi")
class ModuleMetadata {}
