package net.kalars.recipes.controller

import net.kalars.recipes.model.Recipe
import net.kalars.recipes.service.RecipeService
import org.springframework.web.bind.annotation.*
import java.util.regex.Pattern

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = ["http://localhost:5173"]) // HACK! Must fix
class RecipeController(private val recipeService: RecipeService) {

    @GetMapping
    fun getAllRecipes(): List<Recipe> = recipeService.getAllRecipes()

    @PostMapping
    fun createRecipe(@RequestBody recipe: Recipe): Recipe {
        println(recipe)
        return recipeService.createRecipe(recipe)
    }


    @PutMapping("/{id}")
    fun updateRecipe(@PathVariable id: Long, @RequestBody recipe: Recipe): Recipe = recipeService.updateRecipe(id, recipe)

    @DeleteMapping("/{id}")
    fun deleteRecipe(@PathVariable id: Long) = recipeService.deleteRecipe(id)

    @PutMapping("/nullify-source/{sourceId}")
    fun nullifySourceInRecipes(@PathVariable sourceId: Long) = recipeService.nullifySourceInRecipes(sourceId)

    @GetMapping("/search")
    fun searchRecipes(@RequestParam query: String): List<Recipe> {
        val pattern = Pattern.compile(query, Pattern.CASE_INSENSITIVE)
        return recipeService.getAllRecipes().filter { recipe ->
            pattern.matcher(recipe.name).find() ||
                    pattern.matcher(recipe.instructions).find() ||
                    pattern.matcher(recipe.served).find() ||
                    recipe.ingredients.any { ingredient ->
                        pattern.matcher(ingredient.name).find() ||
                                pattern.matcher(ingredient.instruction).find()
                    }
        }
    }
}
