package net.kalars.recipes.controller

import com.fasterxml.jackson.databind.ObjectMapper
import net.kalars.recipes.model.Attachment
import net.kalars.recipes.model.Ingredient
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.ShoppingListItem
import net.kalars.recipes.service.RecipeService
import net.kalars.recipes.service.SourceService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.Base64
import java.util.regex.Pattern
import java.util.stream.Collectors

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = ["\${frontend.url}"])
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
            pattern.matcher(recipe.served ?: "" ).find() ||
            pattern.matcher(recipe.wineTips ?: "").find() ||
            pattern.matcher(recipe.matchFor ?: "").find() ||
            recipe.ingredients.any { ingredient ->
                pattern.matcher(ingredient.name).find() ||
                pattern.matcher(ingredient.prefix ?: "").find() ||
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
                prefix = columns[0],
                amount = columns[1].toFloatOrNull(),
                measure = columns[2],
                name = columns[3],
                instruction = columns[4]
            )
        }.collect(Collectors.toList())
        recipe.ingredients.addAll(ingredientList)

        return recipeService.updateRecipe(recipe.id, recipe)
    }

    @PostMapping("/import")
    fun importRecipes(@RequestParam("file") file: MultipartFile): List<Recipe> {
        val reader = BufferedReader(InputStreamReader(file.inputStream))
        val recipes = mutableListOf<Recipe>()
        val sources = mutableMapOf<String, Long>() // Map to store source names and their IDs
        val subrecipesToAdd = mutableMapOf<String, List<String>>() // Map to store links between main and subrecipes
        var currentRecipe: Recipe? = null

        reader.lines().forEach { line ->
            val columns = line.split("\t")
            when {
                line.isBlank() -> {
                    // Skip empty lines
                }
                line.startsWith("#") -> {
                    // Skip comment lines
                }
                line.startsWith("Source") -> {
                    // Create or fetch the source
                    val sourceName = columns[1]
                    val authors = columns[2].replace("\\n", "\n")
                    val source = sourceService.createOrGetSource(sourceName, authors)
                    sources[sourceName] = source.id
                }
                line.startsWith("Recipe") -> {
                    // Save the previous recipe if it exists
                    currentRecipe?.let { recipes.add(recipeService.createRecipe(it)) }

                    // Create a new recipe
                    currentRecipe = Recipe(
                        name = columns[1],
                        subrecipe = columns[2].toBoolean(),
                        people = columns[3].toInt(),
                        rating = columns[4].toIntOrNull(),
                        served = columns[5].replace("\\n", "\n"),
                        instructions = columns[6].replace("\\n", "\n"),
                        notes = columns[7].replace("\\n", "\n"),
                        pageRef = columns[9]
                    )
                    val sourceId = sources[columns[8]]
                    currentRecipe?.sourceId = sourceId
                }
                line.startsWith("+Ingredient") -> {
                    // Add an ingredient to the current recipe
                    currentRecipe?.ingredients?.add(
                        Ingredient(
                            prefix = columns[1].replace("\\n", "\n"),
                            amount = columns[2].toFloatOrNull(),
                            measure = columns[3],
                            name = columns[4].replace("\\n", "\n"),
                            instruction = columns[5].replace("\\n", "\n")
                        )
                    )
                }
                line.startsWith("+Subrecipe") && currentRecipe!=null -> {
                    // Remember a subrecipe to add later
                    val subName = mutableListOf(columns[1].replace("\\n", "\n"))
                    subrecipesToAdd.merge(
                        currentRecipe!!.name,
                        subName
                    ) { oldMapping, subs -> (oldMapping + subs).distinct() }
                }
                line.startsWith("+Attachment") -> {
                    // Add an attachment to the current recipe
                    val fileName = columns[1].replace("\\n", "\n")
                    val fileContent = String(Base64.getDecoder().decode(columns[2]))
                    currentRecipe?.attachments?.add(
                        Attachment(
                            fileName = fileName,
                            fileContent = fileContent
                        )
                    )
                }
            }
        }

        // Save the last recipe
        currentRecipe?.let { recipes.add(recipeService.createRecipe(it)) }

        // Add subrecipes to the main recipes
        recipes.forEach { recipe ->
            val subrecipeNames = subrecipesToAdd[recipe.name]
            if (subrecipeNames != null) {
                val subrecipes = subrecipeNames.mapNotNull { name ->
                    recipes.find { it.name == name }
                }
                recipe.subrecipes.addAll(subrecipes)
                recipeService.updateRecipe(recipe.id, recipe)
            }
        }

        return recipes
    }

    @PostMapping("/export-all")
    fun exportRecipes(@RequestBody(required = false) recipeIds: List<Long>?): ResponseEntity<String> {
        val recipes: List<Recipe> = if (recipeIds.isNullOrEmpty()) {
            recipeService.getAllRecipes()
        } else {
            recipeService.getRecipesByIds(recipeIds)
        }
        val sources =  sourceService.getAllSources().toMutableList()

        val csvContent = buildString {
            append("# Exported on ${java.time.LocalDateTime.now()}\n")
            append("# Total recipes: ${recipes.size}\n")
            append("# Total sources: ${sources.size}\n")
            append("# Format (\\n for newline, TAB-separated)\n")
            append("# '#' Comment\n")
            append("# 'Source'\tName\tAuthors\n")
            append("# 'Recipe'\tName\tIsSubrecipe:bool\tPeople:int\tRating?:0-6\tServed?\tInstructions\tNotes?\tSource?\tPageRef?\n")
            append("# '+Ingredient'\tPrefix?\tAmount?:float\tMeasure?\tName\tInstruction?\n")
            append("# '+Subrecipe'\tName\n")
            append("# '+Attachment'\tFileName\tBase64Content\n")
            append("\n\n####################\n\n")

            recipes.forEach { recipe ->
                append("\n")
                sources.find { src -> src.id == recipe.sourceId }?.let { source ->
                    append("Source\t${source.name}\t${source.authors.replace("\n", "\\n")}\n")
                    sources.remove(source)
                }
                append(
                    "Recipe\t${recipe.name}\t${recipe.subrecipe}\t${recipe.people}\t${
                        recipe.rating ?: ""
                    }\t${
                        recipe.served?.replace("\n", "\\n") ?: ""
                    }\t${recipe.instructions.replace("\n", "\\n")}\t${
                        recipe.notes?.replace(
                            "\n",
                            "\\n"
                        ) ?: ""
                    }\t${
                        recipe.source?.name ?: ""
                    }\t${recipe.pageRef ?: ""}\n"
                )

                recipe.ingredients.forEach { ingredient ->
                    append(
                        "+Ingredient\t${
                            ingredient.prefix ?: ""
                        }\t${
                            ingredient.amount ?: ""
                        }\t${
                            ingredient.measure ?: ""
                        }\t${ingredient.name.replace("\n", "\\n")}\t${
                            ingredient.instruction?.replace("\n", "\\n") ?: ""
                        }\n"
                    )
                }

                recipe.subrecipes.forEach { subrecipe ->
                    append("+Subrecipe\t${subrecipe.name.replace("\n", "\\n")}\n")
                }

                recipe.attachments.forEach { attachment ->
                    val base64Data = Base64.getEncoder().encodeToString(attachment.fileContent.toByteArray())
                    append("+Attachment\t${attachment.fileName.replace("\n", "\\n")}\t$base64Data\n")
                }
            }
            append("\n\n####################\n\n")
            sources.forEach { source ->
                append("Source\t${source.name}\t${source.authors.replace("\n", "\\n")}\n")
            }
        }

        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .body(csvContent)
    }

    @PostMapping("/shopping-list")
    fun createShoppingList(@RequestBody recipeIds: List<Long>): List<ShoppingListItem> {
        return recipeService.generateShoppingList(recipeIds)
    }

}
