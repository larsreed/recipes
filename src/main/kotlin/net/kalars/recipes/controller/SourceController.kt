package net.kalars.recipes.controller

import net.kalars.recipes.model.Source
import net.kalars.recipes.service.SourceService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/sources")
class SourceController(private val sourceService: SourceService) {

    @GetMapping
    fun getAllSources(): List<Source> = sourceService.getAllSources()

    @PutMapping("/{id}")
    fun updateSource(@PathVariable id: Long, @RequestBody source: Source): Source = sourceService.updateSource(id, source)

    @PostMapping
    fun createSource(@RequestBody source: Source): ResponseEntity<Source> {
        val createdSource = sourceService.saveSource(source)
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSource)
    }

    @GetMapping("/{id}")
    fun getSource(@PathVariable id: Long): ResponseEntity<Source> {
        val source = sourceService.getSource(id)
        return ResponseEntity.ok(source)
    }

    @DeleteMapping("/{id}")
    fun deleteSource(@PathVariable id: Long): ResponseEntity<Void> {
        sourceService.deleteSource(id)
        return ResponseEntity.noContent().build()
    }


}
