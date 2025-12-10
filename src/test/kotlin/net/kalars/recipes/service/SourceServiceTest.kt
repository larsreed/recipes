package net.kalars.recipes.service

import jakarta.persistence.EntityNotFoundException
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.SourceRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.util.*

class SourceServiceTest {

    private lateinit var sourceRepository: SourceRepository
    private lateinit var sourceService: SourceService

    @BeforeEach
    fun setUp() {
        sourceRepository = Mockito.mock(SourceRepository::class.java)
        sourceService = SourceService(sourceRepository)
    }

    @Test
    fun `getAllSources returns all sources`() {
        val sources = listOf(Source(id = 1, name = "Book", authors = "Author", info = "Info", title = "Title"))
        Mockito.`when`(sourceRepository.findAll()).thenReturn(sources)
        val result = sourceService.getAllSources()
        assertEquals(sources, result)
    }

    @Test
    fun `createOrGetSource returns existing source if found`() {
        val source = Source(id = 1, name = "Book", authors = "Author", info = "Info", title = "Title")
        Mockito.`when`(sourceRepository.findByName("Book")).thenReturn(Optional.of(source))
        val result = sourceService.createOrGetSource("Book", "Author", "Info", "Title")
        assertEquals(source, result)
    }

    @Test
    fun `createOrGetSource creates and returns new source if not found`() {
        Mockito.`when`(sourceRepository.findByName("NewBook")).thenReturn(Optional.empty())
        val newSource = Source(name = "NewBook", authors = "NewAuthor", info = "NewInfo", title = "NewTitle")
        Mockito.`when`(sourceRepository.save(Mockito.any(Source::class.java))).thenReturn(newSource)
        val result = sourceService.createOrGetSource("NewBook", "NewAuthor", "NewInfo", "NewTitle")
        assertEquals("NewBook", result.name)
        assertEquals("NewAuthor", result.authors)
    }

    @Test
    fun `deleteSource calls repository deleteById`() {
        sourceService.deleteSource(1L)
        Mockito.verify(sourceRepository).deleteById(1L)
    }

    @Test
    fun `getSource returns source if found`() {
        val source = Source(id = 1, name = "Book", authors = "Author", info = "Info", title = "Title")
        Mockito.`when`(sourceRepository.findById(1L)).thenReturn(Optional.of(source))
        val result = sourceService.getSource(1L)
        assertEquals(source, result)
    }

    @Test
    fun `getSource throws if not found`() {
        Mockito.`when`(sourceRepository.findById(2L)).thenReturn(Optional.empty())
        assertThrows(EntityNotFoundException::class.java) {
            sourceService.getSource(2L)
        }
    }

    @Test
    fun `saveSource saves and returns source`() {
        val source = Source(id = 1, name = "Book", authors = "Author", info = "Info", title = "Title")
        Mockito.`when`(sourceRepository.save(source)).thenReturn(source)
        val result = sourceService.saveSource(source)
        assertEquals(source, result)
    }

    @Test
    fun `updateSource updates and returns source`() {
        val existing = Source(id = 1, name = "Old", authors = "A", info = "Old Info", title = "Old Title")
        val updated = Source(id = 1, name = "New", authors = "B",  info = "New Info", title = "New Title")
        Mockito.`when`(sourceRepository.existsByNameAndIdNot("New", 1L)).thenReturn(false)
        Mockito.`when`(sourceRepository.findById(1L)).thenReturn(Optional.of(existing))
        Mockito.`when`(sourceRepository.save(Mockito.any(Source::class.java))).thenReturn(updated)
        val result = sourceService.updateSource(1L, updated)
        assertEquals("New", result.name)
        assertEquals("B", result.authors)
    }

    @Test
    fun `updateSource throws if name not unique`() {
        val updated = Source(id = 1, name = "Dup", authors = "B",  info = "New Info", title = "New Title")
        Mockito.`when`(sourceRepository.existsByNameAndIdNot("Dup", 1L)).thenReturn(true)
        assertThrows(IllegalArgumentException::class.java) {
            sourceService.updateSource(1L, updated)
        }
    }

    @Test
    fun `updateSource throws if not found`() {
        val updated = Source(id = 1, name = "New", authors = "B", info = "New Info", title = "New Title")
        Mockito.`when`(sourceRepository.existsByNameAndIdNot("New", 1L)).thenReturn(false)
        Mockito.`when`(sourceRepository.findById(1L)).thenReturn(Optional.empty())
        assertThrows(EntityNotFoundException::class.java) {
            sourceService.updateSource(1L, updated)
        }
    }

    @Test
    fun `existsByNameAndIdNot delegates to repository`() {
        Mockito.`when`(sourceRepository.existsByNameAndIdNot("Book", 1L)).thenReturn(true)
        val result = sourceService.existsByNameAndIdNot("Book", 1L)
        assertTrue(result)
    }
}
