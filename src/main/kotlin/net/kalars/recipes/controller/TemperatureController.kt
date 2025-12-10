package net.kalars.recipes.controller

import net.kalars.recipes.model.Temperature
import net.kalars.recipes.repository.TemperatureRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/temperatures")
class TemperatureController(private val temperatureRepository: TemperatureRepository) {

    @GetMapping
    fun getAllTemperatures(): List<Temperature> = temperatureRepository.findAll()

    @PostMapping
    fun addTemperature(@RequestBody temperature: Temperature): Temperature = temperatureRepository.save(temperature)

    @PutMapping("/{id}")
    fun updateTemperature(@PathVariable id: Long, @RequestBody updatedTemperature: Temperature): Temperature {
        val existingTemperature = temperatureRepository.findById(id).orElseThrow { IllegalArgumentException("Temperature not found") }
        return temperatureRepository.save(existingTemperature.copy(
            temp = updatedTemperature.temp,
            meat = updatedTemperature.meat,
            description = updatedTemperature.description
        ))
    }

    @DeleteMapping("/{id}")
    fun deleteTemperature(@PathVariable id: Long) = temperatureRepository.deleteById(id)
}
