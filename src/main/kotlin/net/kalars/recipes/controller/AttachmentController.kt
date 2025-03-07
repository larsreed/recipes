package net.kalars.recipes.controller

import net.kalars.recipes.model.Attachment
import net.kalars.recipes.service.AttachmentService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/attachments")
class AttachmentController(private val attachmentService: AttachmentService) {

    @PostMapping
    fun uploadAttachment(@RequestParam("file") file: MultipartFile): ResponseEntity<Attachment> {
        val attachment = attachmentService.saveAttachment(file)
        return ResponseEntity.status(HttpStatus.CREATED).body(attachment)
    }

    @GetMapping("/{id}")
    fun getAttachment(@PathVariable id: Long): ResponseEntity<Attachment> {
        val attachment = attachmentService.getAttachment(id)
        return ResponseEntity.ok(attachment)
    }

    @DeleteMapping("/{id}")
    fun deleteAttachment(@PathVariable id: Long): ResponseEntity<Void> {
        attachmentService.deleteAttachment(id)
        return ResponseEntity.noContent().build()
    }
}
