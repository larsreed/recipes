package net.kalars.recipes.service

import jakarta.persistence.EntityNotFoundException
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.SourceRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SourceService(private val sourceRepository: SourceRepository) {

    fun getAllSources(): List<Source> = sourceRepository.findAll()

    fun createOrGetSource(name: String, authors: String): Source {
        // Check if the source already exists
        val existingSource = sourceRepository.findByName(name)
        return existingSource.orElseGet {
            // Create and save a new source
            val newSource = Source(name = name, authors = authors)
            sourceRepository.save(newSource)
        }
    }

    fun deleteSource(id: Long) = sourceRepository.deleteById(id)

    fun getSource(id: Long): Source {
        return sourceRepository.findById(id)
            .orElseThrow { EntityNotFoundException("Source not found") }
    }

    fun saveSource(source: Source): Source = sourceRepository.save(source)

    @Transactional
    fun updateSource(id: Long, source: Source): Source {
        if (sourceRepository.existsByNameAndIdNot(source.name, id)) {
            throw IllegalArgumentException("Source name must be unique")
        }
        val existingSource = sourceRepository.findById(id)
            .orElseThrow { EntityNotFoundException("Source not found") }
        val updatedSource = existingSource.copy(name = source.name, authors = source.authors)
        return sourceRepository.save(updatedSource)
    }

    fun existsByNameAndIdNot(name: String, id: Long): Boolean = sourceRepository.existsByNameAndIdNot(name, id)
}
