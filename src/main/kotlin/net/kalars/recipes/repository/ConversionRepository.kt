package net.kalars.recipes.repository

import net.kalars.recipes.model.Conversion
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ConversionRepository : JpaRepository<Conversion, Long>
