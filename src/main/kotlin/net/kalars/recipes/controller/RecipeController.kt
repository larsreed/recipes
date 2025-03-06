package net.kalars.recipes.controller

import net.kalars.recipes.model.Recipe
import net.kalars.recipes.service.RecipeService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/recipes")
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
}
