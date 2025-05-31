package net.kalars.recipes.controller

import net.kalars.recipes.model.Conversion
import net.kalars.recipes.repository.ConversionRepository
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/conversions")
class ConversionController(private val conversionRepository: ConversionRepository) {

    @GetMapping
    fun getAllConversions(): List<Conversion> = conversionRepository.findAll()

    @PostMapping
    fun addConversion(@RequestBody conversion: Conversion): Conversion = conversionRepository.save(conversion)

    @PutMapping("/{id}")
    fun updateConversion(@PathVariable id: Long, @RequestBody updatedConversion: Conversion): Conversion {
        val existingConversion = conversionRepository.findById(id).orElseThrow { IllegalArgumentException("Conversion not found") }
        return conversionRepository.save(existingConversion.copy(
            factor = updatedConversion.factor,
            fromMeasure = updatedConversion.fromMeasure,
            toMeasure = updatedConversion.toMeasure
        ))
    }

    @DeleteMapping("/{id}")
    fun deleteConversion(@PathVariable id: Long) = conversionRepository.deleteById(id)
}
