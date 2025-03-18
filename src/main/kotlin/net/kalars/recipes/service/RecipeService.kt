package net.kalars.recipes.service

import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.RecipeRepository
import net.kalars.recipes.repository.SourceRepository
import org.springframework.stereotype.Service

@Service
class RecipeService(
    private val recipeRepository: RecipeRepository,
    private val sourceRepository: SourceRepository
) {

    fun getAllRecipes(): List<Recipe> = recipeRepository.findAll()

    fun createRecipe(recipe: Recipe): Recipe {
        if (recipe.sourceId != 0L) {
            val source: Source = sourceRepository.findById(recipe.sourceId)
                .orElseThrow { RuntimeException("Source not found") }
            recipe.source = source
        }
        return recipeRepository.save(recipe)
    }

    fun updateRecipe(id: Long, recipe: Recipe): Recipe {
        val existingRecipe = recipeRepository.findById(id)
            .orElseThrow { RuntimeException("Recipe not found") }

        existingRecipe.name = recipe.name
        existingRecipe.ingredients = recipe.ingredients
        existingRecipe.instructions = recipe.instructions
        existingRecipe.people = recipe.people
        existingRecipe.served = recipe.served
        existingRecipe.pageRef = recipe.pageRef
        existingRecipe.rating = recipe.rating
        existingRecipe.notes = recipe.notes

        existingRecipe.source = if (recipe.sourceId == 0L) null else {
            sourceRepository.findById(recipe.sourceId).orElseThrow { RuntimeException("Source not found") }
        }

        return recipeRepository.save(existingRecipe)
    }
    fun deleteRecipe(id: Long) = recipeRepository.deleteById(id)

    fun nullifySourceInRecipes(sourceId: Long) {
        val recipes = recipeRepository.findBySource_Id(sourceId)
        recipes.forEach { it.source = null }
        recipeRepository.saveAll(recipes)
    }
}
