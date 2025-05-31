package net.kalars.recipes.repository

import net.kalars.recipes.model.Temperature
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TemperatureRepository : JpaRepository<Temperature, Long>
