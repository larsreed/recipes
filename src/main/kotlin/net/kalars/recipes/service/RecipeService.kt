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

    fun getMainRecipes(): List<Recipe> = recipeRepository.findBySubrecipeFalse()

    fun getRecipeById(id: Long): Recipe = recipeRepository.findById(id)
        .orElseThrow { RuntimeException("Recipe not found") }

    fun createRecipe(recipe: Recipe): Recipe {
        if (recipe.sourceId != null && recipe.sourceId != 0L) {
            val source: Source = sourceRepository.findById(recipe.sourceId!!)
                .orElseThrow { RuntimeException("Source not found") }
            recipe.source = source
        }
        return recipeRepository.save(recipe)
    }

    fun createRecipe(recipe: Recipe, sourceName: String?): Recipe {
        if (sourceName.isNullOrBlank()) return createRecipe(recipe)
        val source = sourceRepository.findByName(sourceName)
            .orElseThrow { RuntimeException("Source $sourceName not found") }
        return createRecipe(recipe.copy(sourceId = source.id))
    }

    fun updateRecipe(id: Long, recipe: Recipe): Recipe {
        val existingRecipe = recipeRepository.findById(id)
            .orElseThrow { RuntimeException("Recipe not found") }

        existingRecipe.name = recipe.name
        existingRecipe.subrecipe = recipe.subrecipe
        existingRecipe.instructions = recipe.instructions
        existingRecipe.people = recipe.people
        existingRecipe.served = recipe.served
        existingRecipe.pageRef = recipe.pageRef
        existingRecipe.rating = recipe.rating
        existingRecipe.notes = recipe.notes
        existingRecipe.wineTips = recipe.wineTips

        updateCollection(existingRecipe.ingredients, recipe.ingredients)
        updateCollection(existingRecipe.attachments, recipe.attachments)

        existingRecipe.sourceId = recipe.sourceId
        existingRecipe.source = if (recipe.sourceId == null || recipe.sourceId == 0L)
            null else {
                sourceRepository.findById(recipe.sourceId!!)
                    .orElseThrow { RuntimeException("Source ${recipe.sourceId} not found") }
        }

        // Update subrecipes and preserve order
        val subrecipes = recipe.subrecipes.map { subrecipe ->
            recipeRepository.findById(subrecipe.id)
                .orElseThrow { RuntimeException("Subrecipe not found") }
        }
        existingRecipe.subrecipes.clear()
        existingRecipe.subrecipes.addAll(subrecipes)

        return recipeRepository.save(existingRecipe)
    }

    private fun <T> updateCollection(existingCollection: MutableList<T>, newCollection: List<T>) {
        val toRemove = existingCollection.filterNot { it in newCollection }
        val toAdd = newCollection.filterNot { it in existingCollection }

        existingCollection.removeAll(toRemove)
        existingCollection.addAll(toAdd)
    }

    fun deleteRecipe(id: Long) = recipeRepository.deleteById(id)

    fun nullifySourceInRecipes(sourceId: Long) {
        val recipes = recipeRepository.findBySourceId(sourceId)
        recipes.forEach { it.source = null }
        recipeRepository.saveAll(recipes)
    }

    fun findBySubrecipesId(subrecipeId: Long): List<Recipe> = recipeRepository.findBySubrecipesId(subrecipeId)

    fun getRecipesByIds(recipeIds: List<Long>): List<Recipe> =  recipeRepository.findAllById(recipeIds)
}
