package net.kalars.recipes.repository

import net.kalars.recipes.model.Attachment
import org.springframework.data.jpa.repository.JpaRepository

interface AttachmentRepository : JpaRepository<Attachment, Long>
