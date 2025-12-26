package com.bcc.uploads.service

import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.util.*

@Service
class UploadService {

    fun createFile(file: MultipartFile): String? {
        val name = (file.originalFilename ?: "upload.pdf").lowercase()
        if (!name.endsWith(".pdf")) {
            return null;
        }
        val uploadId = UUID.randomUUID().toString()
        val uploadsDir = getUploadDirectory()
        val dest = getPathToFile(uploadsDir, uploadId)
        file.inputStream.use { input ->
            Files.copy(input, dest.toPath(), StandardCopyOption.REPLACE_EXISTING)
        }
        return uploadId
    }

    private fun getPathToFile(uploadsDir: Path, uploadId: String): File = uploadsDir.resolve("$uploadId.pdf").toFile()

    private fun getUploadDirectory(): Path {
        val result = Path.of("uploads").toAbsolutePath()
        Files.createDirectories(result);
        return result;
    }

    fun getFile(uploadId: String): File? {
        val uploadsDir = getUploadDirectory()
        val dest = getPathToFile(uploadsDir, uploadId)
        if (dest.exists()) {
            return dest
        }

        return null
    }

    fun getChapterPath(uploadId: String, chapterId: String): Path {
        val path = Path.of("uploads").resolve("notes/${uploadId}/${chapterId}").toAbsolutePath()
        Files.createDirectories(path)
        return path
    }
}