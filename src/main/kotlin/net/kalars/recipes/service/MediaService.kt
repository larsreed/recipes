package net.kalars.recipes.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.file.Files
import java.nio.file.Path

@Service
class MediaService(
    @Value("\${media.paths:./data/media}") mediaPathsProperty: String
) {
    private val mediaDirectories: List<Path> = mediaPathsProperty
        .split(',')
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .map { Path.of(it).toAbsolutePath().normalize() }
        .distinct()

    private val imageExtensions = setOf("jpg", "jpeg", "png", "gif", "webp", "bmp", "svg")

    /** Finds the first regular file with this name; names escaping a media directory never match. */
    fun resolveMediaFile(fileName: String): Path? =
        mediaDirectories.firstNotNullOfOrNull { mediaDirectory ->
            val mediaFile = mediaDirectory.resolve(fileName).normalize()
            mediaFile.takeIf {
                it.startsWith(mediaDirectory) && Files.exists(it) && Files.isRegularFile(it)
            }
        }

    fun listImageFiles(): List<String> {
        val files = linkedSetOf<String>()
        mediaDirectories
            .filter { Files.exists(it) && Files.isDirectory(it) }
            .forEach { mediaDirectory ->
                Files.list(mediaDirectory).use { stream ->
                    stream
                        .filter { Files.isRegularFile(it) }
                        .map { it.fileName.toString() }
                        .filter { it.substringAfterLast('.', "").lowercase() in imageExtensions }
                        .forEach { files.add(it) }
                }
            }
        return files.sortedWith(String.CASE_INSENSITIVE_ORDER)
    }
}
