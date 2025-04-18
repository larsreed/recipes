package net.kalars.recipes.controller

import com.fasterxml.jackson.databind.ObjectMapper
import net.kalars.recipes.model.Attachment
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.Ingredient
import net.kalars.recipes.service.RecipeService
import net.kalars.recipes.service.SourceService
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.util.regex.Pattern
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.stream.Collectors

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = ["\${frontend.url}"]) // TODO HACK! Must fix
class RecipeController(private val recipeService: RecipeService,
                       private val sourceService: SourceService
) {

    @GetMapping
    fun getRecipes(@RequestParam includeSubrecipes: Boolean): List<Recipe> {
        return if (includeSubrecipes) {
            recipeService.getAllRecipes()
        } else {
            recipeService.getMainRecipes()
        }
    }

    @GetMapping("/references/{subrecipeId}")
    fun getMainRecipesReferencingSubrecipe(@PathVariable subrecipeId: Long): List<Recipe> {
        return recipeService.findBySubrecipesId(subrecipeId)
    }

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
            pattern.matcher(recipe.wineTips ?: "").find() ||
            recipe.ingredients.any { ingredient ->
                pattern.matcher(ingredient.name).find() ||
                pattern.matcher(ingredient.instruction ?: "").find()
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
            val sourceName = columns[8]
            recipeService.createRecipe(
                Recipe(
                    name = columns[0],
                    subrecipe = columns[1].toBoolean(),
                    people = columns[2].toInt(),
                    instructions = columns[3],
                    served = columns[4],
                    rating = columns[5].toIntOrNull(),
                    wineTips = columns[6],
                    notes = columns[7],
                    pageRef = columns[9]
                ), sourceName)
        }.collect(Collectors.toList())
        return recipes
    }


    @PostMapping("/export-all")
    fun exportRecipes(@RequestParam("file") fileName: String, @RequestBody(required = false) recipeIds: List<Long>?) {
        val file = File(URLDecoder.decode(fileName, StandardCharsets.UTF_8.toString()))
        val recipes: List<Recipe> = if (recipeIds.isNullOrEmpty()) {
            // Fetch all recipes if the body is empty
            recipeService.getAllRecipes()
        } else {
            // Fetch recipes by IDs
            recipeService.getRecipesByIds(recipeIds)
        }
        val sources = sourceService.getAllSources()

        file.bufferedWriter().use { writer ->
            sources.forEach { source ->
                writer.write("Source\t${source.name}\t${source.authors.replace("\n", "\\n")}")
                writer.newLine()
            }

            recipes.forEach { recipe ->

                // Write recipe record
                writer.write("Recipe\t${recipe.name}\t${recipe.subrecipe}\t${recipe.people}\t${recipe.rating ?: ""}\t${recipe.served?.replace("\n", "\\n") ?: ""}\t${recipe.instructions.replace("\n", "\\n")}\t${recipe.notes?.replace("\n", "\\n") ?: ""}\t${recipe.source?.name ?: ""}\t${recipe.pageRef ?: ""}")
                writer.newLine()

                // Write ingredient records
                recipe.ingredients.forEach { ingredient ->
                    writer.write("+Ingredient\t${ingredient.amount ?: ""}\t${ingredient.measure ?: ""}\t${ingredient.name.replace("\n", "\\n")}\t${ingredient.instruction?.replace("\n", "\\n")}")
                    writer.newLine()
                }

                // Write subrecipe records
                recipe.subrecipes.forEach { subrecipe ->
                    writer.write("+Subrecipe\t${subrecipe.name.replace("\n", "\\n")}")
                    writer.newLine()
                }

                // Write attachment records
                recipe.attachments.forEach { attachment ->
                    val base64Data = Base64.getEncoder().encodeToString(attachment.fileContent.toByteArray())
                    writer.write("+Attachment\t${attachment.fileName.replace("\n", "\\n")}\t$base64Data")
                    writer.newLine()
                }
            }
        }
    }
}
