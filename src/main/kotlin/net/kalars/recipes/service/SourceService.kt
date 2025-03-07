package net.kalars.recipes.service

import jakarta.persistence.EntityNotFoundException
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.SourceRepository
import org.springframework.stereotype.Service

@Service
class SourceService(private val sourceRepository: SourceRepository) {

    fun getAllSources(): List<Source> = sourceRepository.findAll()

    fun createSource(source: Source): Source = sourceRepository.save(source)

    fun deleteSource(id: Long) = sourceRepository.deleteById(id)

    fun getSource(id: Long): Source {
        return sourceRepository.findById(id)
            .orElseThrow { EntityNotFoundException("Source not found") }
    }

    fun saveSource(source: Source): Source = sourceRepository.save(source)

    fun updateSource(id: Long, source: Source): Source {
        val existingSource = sourceRepository.findById(id).orElseThrow { RuntimeException("Source not found") }
        val updatedSource = existingSource.copy(name = source.name, authors = source.authors)
        return sourceRepository.save(updatedSource)
    }
}
