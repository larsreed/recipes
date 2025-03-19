package net.kalars.recipes.repository

import net.kalars.recipes.model.Source
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface SourceRepository : JpaRepository<Source, Long> {
    fun existsByName(name: String): Boolean
    fun existsByNameAndIdNot(name: String, id: Long): Boolean
    fun findByName(name: String): Optional<Source>
}
