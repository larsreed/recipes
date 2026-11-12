package net.kalars.recipes.service

import net.kalars.recipes.model.Recipe
import org.springframework.stereotype.Service
import java.util.regex.Pattern

@Service
class RecipeSearchService(private val recipeService: RecipeService) {

    /** Case-insensitive regex search over recipe text fields and ingredients. */
    fun search(query: String): List<Recipe> {
        val pattern = Pattern.compile(query, Pattern.CASE_INSENSITIVE)
        fun matches(text: String?) = pattern.matcher(text ?: "").find()

        return recipeService.getAllRecipes().filter { recipe ->
            listOf(
                recipe.name, recipe.instructions, recipe.closing, recipe.served,
                recipe.wineTips, recipe.categories, recipe.matchFor
            ).any(::matches) ||
                recipe.ingredients.any { ingredient ->
                    listOf(ingredient.name, ingredient.preamble, ingredient.prefix, ingredient.instruction)
                        .any(::matches)
                }
        }
    }
}
