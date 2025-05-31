package net.kalars.recipes.controller

import net.kalars.recipes.model.Temperature
import net.kalars.recipes.repository.TemperatureRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/temperatures")
class TemperatureController(private val TemperatureRepository: TemperatureRepository) {

    @GetMapping
    fun getAllTemperatures(): List<Temperature> = TemperatureRepository.findAll()

    @PostMapping
    fun addTemperature(@RequestBody temperature: Temperature): Temperature = TemperatureRepository.save(temperature)

    @PutMapping("/{id}")
    fun updateTemperature(@PathVariable id: Long, @RequestBody updatedTemperature: Temperature): Temperature {
        val existingTemperature = TemperatureRepository.findById(id).orElseThrow { IllegalArgumentException("Temperature not found") }
        return TemperatureRepository.save(existingTemperature.copy(
            temp = updatedTemperature.temp,
            meat = updatedTemperature.meat,
        ))
    }

    @DeleteMapping("/{id}")
    fun deleteTemperature(@PathVariable id: Long) = TemperatureRepository.deleteById(id)
}
