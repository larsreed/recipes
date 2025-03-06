package net.kalars.recipes.controller

import net.kalars.recipes.model.Source
import net.kalars.recipes.service.SourceService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/sources")
class SourceController(private val sourceService: SourceService) {

    @GetMapping
    fun getAllSources(): List<Source> = sourceService.getAllSources()

    @PostMapping
    fun createSource(@RequestBody source: Source): Source = sourceService.createSource(source)

    @PutMapping("/{id}")
    fun updateSource(@PathVariable id: Long, @RequestBody source: Source): Source = sourceService.updateSource(id, source)

    @DeleteMapping("/{id}")
    fun deleteRecipe(@PathVariable id: Long) = sourceService.deleteSource(id)
}
