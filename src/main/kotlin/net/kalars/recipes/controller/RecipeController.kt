package net.kalars.recipes.controller

import com.fasterxml.jackson.databind.ObjectMapper
import net.kalars.recipes.model.Attachment
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.Source
import net.kalars.recipes.model.Ingredient
import net.kalars.recipes.service.RecipeService
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.regex.Pattern
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.*
import java.util.stream.Collectors

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = ["http://localhost:5173"]) // TODO HACK! Must fix
class RecipeController(private val recipeService: RecipeService) {

    @GetMapping
    fun getAllRecipes(): List<Recipe> = recipeService.getAllRecipes()

    @PostMapping
    fun createRecipe(@RequestBody recipe: Recipe): Recipe {
         return recipeService.createRecipe(recipe)
    }

    @PostMapping("/{id}/attachments")
    fun addAttachment(@PathVariable id: Long, @RequestParam("file") file: MultipartFile): Recipe {
        println(id.toString())
        val recipe = recipeService.getRecipeById(id)
        val attachment = Attachment(
            fileName = file.originalFilename ?: "unknown",
            fileContent = Base64.getEncoder().encodeToString(file.bytes)
        )
        println("Attachment $attachment")
        recipe.attachments.add(attachment)
        return recipeService.updateRecipe(id, recipe)
    }

    @DeleteMapping("/{recipeId}/attachments/{attachmentId}")
    fun deleteAttachment(@PathVariable recipeId: Long, @PathVariable attachmentId: Long): Recipe {
        val recipe = recipeService.getRecipeById(recipeId)
        recipe.attachments.removeIf { it.id == attachmentId }
        return recipeService.updateRecipe(recipeId, recipe)
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

    @PostMapping("/import-ingredients")
    fun importIngredients(@RequestParam("file") file: MultipartFile, @RequestParam("recipe") recipeJson: String): Recipe {
        val recipe = ObjectMapper().readValue(recipeJson, Recipe::class.java)
        val reader = BufferedReader(InputStreamReader(file.inputStream))
        val ingredientList = reader.lines().skip(1).map { line ->
            val columns = line.split(",", ";", "\t")
            Ingredient(
                amount = columns[0].toFloatOrNull(),
                measure = columns[1],
                name = columns[2],
                instruction = columns[3]
            )
        }.collect(Collectors.toList())
        recipe.ingredients.addAll(ingredientList)

        return recipeService.updateRecipe(recipe.id, recipe)
    }

    @PostMapping("/import")
    fun importRecipes(@RequestParam("file") file: MultipartFile): List<Recipe> {
        val reader = BufferedReader(InputStreamReader(file.inputStream))
        val recipes = reader.lines().skip(1).map { line ->
            val columns = line.replace("\\n", "\n").split(",", ";", "\t")
            val sourceName = columns[6]
            recipeService.createRecipe(
                Recipe(
                    name = columns[0],
                    people = columns[1].toInt(),
                    instructions = columns[2],
                    served = columns[3],
                    rating = columns[4].toIntOrNull(),
                    notes = columns[5],
                    pageRef = columns[7]
                ), sourceName)
        }.collect(Collectors.toList())
        return recipes
    }
}
