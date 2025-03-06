package net.kalars.recipes.repository

import net.kalars.recipes.model.Source
import org.springframework.data.jpa.repository.JpaRepository

interface SourceRepository : JpaRepository<Source, Long>
