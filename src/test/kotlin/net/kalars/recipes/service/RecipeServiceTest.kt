package net.kalars.recipes.service

import net.kalars.recipes.model.*
import net.kalars.recipes.repository.RecipeRepository
import net.kalars.recipes.repository.SourceRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.util.*

class RecipeServiceTest {

    private lateinit var recipeRepository: RecipeRepository
    private lateinit var sourceRepository: SourceRepository
    private lateinit var recipeService: RecipeService

    @BeforeEach
    fun setUp() {
        recipeRepository = Mockito.mock(RecipeRepository::class.java)
        sourceRepository = Mockito.mock(SourceRepository::class.java)
        recipeService = RecipeService(recipeRepository, sourceRepository)
    }

    @Test
    fun `getAllRecipes returns all recipes`() {
        val recipes = listOf(
            Recipe(
                id = 1,
                name = "Cake",
                people = 2,
                instructions = "Mix and bake"
            )
        )
        Mockito.`when`(recipeRepository.findAll()).thenReturn(recipes)
        val result = recipeService.getAllRecipes()
        assertEquals(recipes, result)
    }

    @Test
    fun `getRecipeById returns recipe if found`() {
        val recipe = Recipe(
            id = 1,
            name = "Pie",
            people = 4,
            instructions = "Bake"
        )
        Mockito.`when`(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe))
        val result = recipeService.getRecipeById(1L)
        assertEquals(recipe, result)
    }

    @Test
    fun `createRecipe saves and returns recipe`() {
        val recipe = Recipe(
            id = 1,
            name = "Bread",
            people = 3,
            instructions = "Knead and bake"
        )
        Mockito.`when`(recipeRepository.save(recipe)).thenReturn(recipe)
        val result = recipeService.createRecipe(recipe)
        assertEquals(recipe, result)
    }

    @Test
    fun `updateRecipe updates and returns recipe`() {
        val existing = Recipe(
            id = 1,
            name = "Old",
            people = 2,
            instructions = "Old instructions"
        )
        val updated = Recipe(
            id = 1,
            name = "New",
            people = 4,
            instructions = "New instructions"
        )
        Mockito.`when`(recipeRepository.findById(1L)).thenReturn(Optional.of(existing))
        Mockito.`when`(recipeRepository.save(existing)).thenReturn(existing)
        val result = recipeService.updateRecipe(1L, updated)
        assertEquals("New", result.name)
        assertEquals(4, result.people)
    }

    @Test
    fun `deleteRecipe deletes recipe by id`() {
        recipeService.deleteRecipe(1L)
        Mockito.verify(recipeRepository).deleteById(1L)
    }

    @Test
    fun `nullifySourceInRecipes sets source to null and saves`() {
        val source = Source(id = 2, name = "S", authors = "A")
        val recipe = Recipe(
            id = 1,
            name = "Test",
            people = 1,
            instructions = "Test instructions",
            sourceId = 2
        ).apply { this.source = source }
        Mockito.`when`(recipeRepository.findBySourceId(2L)).thenReturn(listOf(recipe))
        recipeService.nullifySourceInRecipes(2L)
        assertNull(recipe.source)
        Mockito.verify(recipeRepository).saveAll(listOf(recipe))
    }
}
