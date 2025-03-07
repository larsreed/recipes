package net.kalars.recipes.service

import jakarta.persistence.EntityNotFoundException
import net.kalars.recipes.model.Attachment
import net.kalars.recipes.repository.AttachmentRepository
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

@Service
class AttachmentService(private val attachmentRepository: AttachmentRepository) {

    fun saveAttachment(file: MultipartFile): Attachment {
        val attachment = Attachment(
            fileName = file.originalFilename ?: "unknown",
            fileType = file.contentType ?: "unknown",
            data = file.bytes
        )
        return attachmentRepository.save(attachment)
    }

    fun getAttachment(id: Long): Attachment {
        return attachmentRepository.findById(id).orElseThrow { EntityNotFoundException("Attachment not found") }
    }

    fun deleteAttachment(id: Long) {
        attachmentRepository.deleteById(id)
    }
}
