package net.kalars.recipes.service

import net.kalars.recipes.model.Conversion
import net.kalars.recipes.model.Ingredient
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.ShoppingListItem
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.RecipeRepository
import net.kalars.recipes.repository.SourceRepository
import net.kalars.recipes.repository.ConversionRepository
import org.springframework.stereotype.Service

@Service
class RecipeService(
    private val recipeRepository: RecipeRepository,
    private val sourceRepository: SourceRepository,
    private val conversionRepository: ConversionRepository
) {

    fun getAllRecipes(): List<Recipe> = recipeRepository.findAll()

    fun getMainRecipes(): List<Recipe> = recipeRepository.findBySubrecipeFalse()

    fun getRecipeById(id: Long): Recipe = recipeRepository.findById(id)
        .orElseThrow { RuntimeException("Recipe not found") }

    fun createRecipe(recipe: Recipe): Recipe {
        if (recipeRepository.findByName(recipe.name) != null) {
            throw RuntimeException("Recipe name must be unique")
        }
        if (recipe.sourceId != null && recipe.sourceId != 0L) {
            val source: Source = sourceRepository.findById(recipe.sourceId!!)
                .orElseThrow { RuntimeException("Source not found") }
            recipe.source = source
        }
        return recipeRepository.save(recipe)
    }

    fun saveRecipe(recipe: Recipe): Recipe {
        return recipeRepository.save(recipe)
    }

    fun updateRecipe(id: Long, recipe: Recipe): Recipe {
        val existingRecipe = recipeRepository.findById(id)
            .orElseThrow { RuntimeException("Recipe not found") }

        // Check for duplicate name (excluding self)
        val duplicate = recipeRepository.findByName(recipe.name)
        if (duplicate != null && duplicate.id != id) {
            throw RuntimeException("Recipe name must be unique")
        }

        existingRecipe.name = recipe.name
        existingRecipe.subrecipe = recipe.subrecipe
        existingRecipe.instructions = recipe.instructions
        existingRecipe.closing = recipe.closing
        existingRecipe.people = recipe.people
        existingRecipe.served = recipe.served
        existingRecipe.pageRef = recipe.pageRef
        existingRecipe.rating = recipe.rating
        existingRecipe.notes = recipe.notes
        existingRecipe.wineTips = recipe.wineTips
        existingRecipe.matchFor = recipe.matchFor
        existingRecipe.categories = recipe.categories

        existingRecipe.ingredients.clear()
        recipe.ingredients.forEachIndexed { index, ingredientDto ->
            val ing = Ingredient(
                id = ingredientDto.id,
                preamble = ingredientDto.preamble,
                amount = ingredientDto.amount,
                measure = ingredientDto.measure,
                name = ingredientDto.name,
                prefix = ingredientDto.prefix,
                instruction = ingredientDto.instruction,
                sortorder = index
            )
            existingRecipe.ingredients.add(ing)
        }

        updateCollection(existingRecipe.attachments, recipe.attachments)

        existingRecipe.sourceId = recipe.sourceId
        existingRecipe.source = if (recipe.sourceId == null || recipe.sourceId == 0L)
            null else {
                sourceRepository.findById(recipe.sourceId!!)
                    .orElseThrow { RuntimeException("Source \\${recipe.sourceId} not found") }
        }

        // Update subrecipes and preserve order
        existingRecipe.subrecipes.clear()
        recipe.subrecipes.forEach { subrecipe ->
            val subr = recipeRepository.findById(subrecipe.id)
                .orElseThrow { RuntimeException("Subrecipe not found") }
            existingRecipe.subrecipes.add(subr)
        }

        return recipeRepository.save(existingRecipe)
    }

    private fun <T> updateCollection(existingCollection: MutableList<T>, newCollection: List<T>) {
        val toRemove = existingCollection.filterNot { it in newCollection }
        val toAdd = newCollection.filterNot { it in existingCollection }

        existingCollection.removeAll(toRemove)
        existingCollection.addAll(toAdd)
    }

    fun deleteRecipe(id: Long) = recipeRepository.deleteById(id)

    // RecipeService.kt
    fun deleteRecipesByIds(ids: List<Long>) {
        recipeRepository.deleteAllById(ids)
    }

    fun nullifySourceInRecipes(sourceId: Long) {
        val recipes = recipeRepository.findBySourceId(sourceId)
        recipes.forEach { it.source = null }
        recipeRepository.saveAll(recipes)
    }

    fun findBySubrecipesId(subrecipeId: Long): List<Recipe> = recipeRepository.findBySubrecipesId(subrecipeId)

    fun getRecipesByIds(recipeIds: List<Long>): List<Recipe> =  recipeRepository.findAllById(recipeIds)

    fun generateShoppingList(recipeIds: List<Long>, guests: Int): List<ShoppingListItem> {
        val ingredients = mutableListOf<ShoppingListItem>()
        val preferredConversions = conversionRepository.findAll().filter { it.preferred }

        recipeIds.forEach { recipeId ->
            val recipe = recipeRepository.findById(recipeId).orElseThrow {
                IllegalArgumentException("Recipe not found: $recipeId")
            }
            collectIngredients(recipe, ingredients, guests, preferredConversions)
        }
        return ingredients.sortedBy { it.name }
    }

    private fun collectIngredients(
        recipe: Recipe,
        ingredients: MutableList<ShoppingListItem>,
        guests: Int,
        preferredConversions: List<Conversion>
    ) {
        val people = if (recipe.people>0) recipe.people else guests // if 0, then fixed amount
        recipe.ingredients.forEach { ingredient ->
            val conversion = preferredConversions.find { it.fromMeasure == ingredient.measure }
            val actual = if (conversion != null) {
                Ingredient(
                    name = ingredient.name,
                    amount = (ingredient.amount ?: 0f) * conversion.factor,
                    measure = conversion.toMeasure
                )
            } else {
                ingredient
            }
            val existingItem = ingredients.find {
                (it.name == actual.name) && (it.measure == actual.measure)
            }
            if (existingItem != null) {
                existingItem.amount = (existingItem.amount ?: 0f) + (actual.amount ?: 0f) * (guests / people)
            } else {
                ingredients.add(ShoppingListItem(actual.name, ((actual.amount ?: 0f) * guests) / people,
                    actual.measure))
            }
        }
        recipe.subrecipes.forEach { subrecipe -> collectIngredients(
            subrecipe,
            ingredients,
            guests,
            preferredConversions
        ) }
    }

}
