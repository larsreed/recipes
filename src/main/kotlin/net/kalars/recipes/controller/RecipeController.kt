package net.kalars.recipes.controller

import com.fasterxml.jackson.databind.ObjectMapper
import net.kalars.recipes.model.*
import net.kalars.recipes.repository.ConversionRepository
import net.kalars.recipes.repository.TemperatureRepository
import net.kalars.recipes.service.RecipeService
import net.kalars.recipes.service.SourceService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.Base64
import java.util.regex.Pattern

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = ["\${frontend.url}"])
class RecipeController(
    private val recipeService: RecipeService,
    private val sourceService: SourceService,
    private val conversionRepository: ConversionRepository,
    private val temperatureRepository: TemperatureRepository
) {

    private fun report(message: String): ResponseEntity<String> {
        System.err.println(message)
        return ResponseEntity.badRequest().body(message)
    }

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
    fun createRecipe(@RequestBody recipe: Recipe): ResponseEntity<Any> {
        return try {
            ResponseEntity.ok(recipeService.createRecipe(recipe))
        } catch (e: RuntimeException) {
            val errorMsg = if (e.message?.contains("unique") == true || e.message?.contains("unique constraint") == true) {
                "A recipe with this name already exists. Please choose a different name."
            } else {
                e.message ?: "Unknown error occurred."
            }
            ResponseEntity.badRequest().body(mapOf("error" to errorMsg))
        }
    }

    @PostMapping("/{id}/attachments")
    fun addAttachment(@PathVariable id: Long, @RequestParam("file") file: MultipartFile): Recipe {
        val recipe = recipeService.getRecipeById(id)
        val attachment = Attachment(
            fileName = file.originalFilename ?: "unknown",
            fileContent = Base64.getEncoder().encodeToString(file.bytes)
        )
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
    fun updateRecipe(@PathVariable id: Long, @RequestBody recipe: Recipe): ResponseEntity<Any> {
        return try {
            ResponseEntity.ok(recipeService.updateRecipe(id, recipe))
        } catch (e: RuntimeException) {
            val errorMsg = if (e.message?.contains("unique") == true || e.message?.contains("unique constraint") == true) {
                "A recipe with this name already exists. Please choose a different name."
            } else {
                e.message ?: "Unknown error occurred."
            }
            ResponseEntity.badRequest().body(mapOf("error" to errorMsg))
        }
    }

    @DeleteMapping("/{id}")
    fun deleteRecipe(@PathVariable id: Long) = recipeService.deleteRecipe(id)

    // RecipeController.kt
    @PostMapping("/delete-many")
    fun deleteRecipes(@RequestBody ids: List<Long>): ResponseEntity<Void> {
        recipeService.deleteRecipesByIds(ids)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/nullify-source/{sourceId}")
    fun nullifySourceInRecipes(@PathVariable sourceId: Long) = recipeService.nullifySourceInRecipes(sourceId)

    @GetMapping("/search")
    fun searchRecipes(@RequestParam query: String): List<Recipe> {
        val pattern = Pattern.compile(query, Pattern.CASE_INSENSITIVE)
        return recipeService.getAllRecipes().filter { recipe ->
            pattern.matcher(recipe.name).find() ||
            pattern.matcher(recipe.instructions ?: "").find() ||
            pattern.matcher(recipe.closing ?: "").find() ||
            pattern.matcher(recipe.served ?: "").find() ||
            pattern.matcher(recipe.wineTips ?: "").find() ||
            pattern.matcher(recipe.categories ?: "").find() ||
            pattern.matcher(recipe.matchFor ?: "").find() ||
            recipe.ingredients.any { ingredient ->
                pattern.matcher(ingredient.name).find() ||
                pattern.matcher(ingredient.preamble ?: "").find() ||
                pattern.matcher(ingredient.prefix ?: "").find() ||
                pattern.matcher(ingredient.instruction ?: "").find()
            }
        }
    }

    @PostMapping("/import-ingredients")
    fun importIngredients(@RequestParam("file") file: MultipartFile, @RequestParam("recipe") recipeJson: String): Recipe {
        val recipe = ObjectMapper().readValue(recipeJson, Recipe::class.java)
        val reader = BufferedReader(InputStreamReader(file.inputStream))
        val ingredientList = mutableListOf<Ingredient>()

        reader.lines().skip(1).forEach { line ->
            val columns = line.split(",", ";", "\t")
            if (columns.size != 6) report("Invalid ingredient line: $line")
            else ingredientList.add(
                Ingredient(
                    preamble = columns[0],
                    amount = columns[1].toFloatOrNull(),
                    measure = columns[2],
                    prefix = columns[3],
                    name = columns[4],
                    instruction = columns[5]
            ))
        }
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
        var lineNo = 0

        reader.lines().forEach { line ->
            val columns = line.trim().split("\t").toMutableList().apply { while (size < 100) add("") }
            lineNo++
            when {
                line.isBlank() -> {
                    // Skip empty lines
                }

                line.startsWith("#") -> {
                    // Skip comment lines
                }

                line.startsWith("Source") -> {
                    // Create or fetch the source
                    if (columns.size < 3) {
                        report("Invalid Source line ($lineNo): $line")
                        return@forEach
                    }
                    val sourceName = columns[1]
                    val authors = columns[2].replace("\\n", "\n")
                    val info = columns[3].replace("\\n", "\n")
                    val title = columns.getOrNull(4)?.replace("\\n", "\n")
                    val source = sourceService.createOrGetSource(sourceName, authors, info, title)
                    sources[sourceName] = source.id
                }

                line.startsWith("Recipe") -> {
                    // Save the previous recipe if it exists
                    currentRecipe?.let { recipes.add(recipeService.createRecipe(it)) }

                    // Create a new recipe
                    if (columns.size < 2) {
                        report("Invalid Recipe line ($lineNo): $line")
                        return@forEach
                    }
                    currentRecipe = Recipe(
                        name = columns[1],
                        subrecipe = columns[2].toBoolean(),
                        people = columns[3].toInt(),
                        rating = columns[4].toIntOrNull(),
                        served = columns[5].replace("\\n", "\n"),
                        instructions = columns[6].replace("\\n", "\n"),
                        closing = columns[7].replace("\\n", "\n"),
                        notes = columns[8].replace("\\n", "\n"),
                        pageRef = columns[10],
                        wineTips = columns[11].replace("\\n", "\n"),
                        matchFor = columns[12].replace("\\n", "\n"),
                        categories = columns[13]
                    )
                    val sourceId = sources[columns[9]]
                    if (sourceId == null && columns[9].isNotBlank()) {
                        report("Warning: Recipe '${columns[1]}' references a non-existing source '${columns[9]}'.")
                    }
                    currentRecipe?.sourceId = sourceId
                }

                line.startsWith("Ingredient") -> {
                    // Add an ingredient to the current recipe
                    if (columns.size < 2) {
                        report("Invalid Ingredient line ($lineNo): $line")
                        return@forEach
                    }
                    if (currentRecipe==null) {
                        report("Ingredient without Recipe ($lineNo): $line")
                        return@forEach
                    }
                    currentRecipe?.ingredients?.add(
                        Ingredient(
                            preamble = columns[1].replace("\\n", "\n"),
                            amount = columns[2].toFloatOrNull(),
                            measure = columns[3],
                            prefix = columns[4].replace("\\n", "\n"),
                            name = columns[5].replace("\\n", "\n"),
                            instruction = columns[6].replace("\\n", "\n")
                        )
                    )
                }

                line.startsWith("Subrecipe") -> {
                    // Remember a subrecipe to add later
                    if (columns.size < 2) {
                        report("Invalid Subrecipe line ($lineNo): $line")
                        return@forEach
                    }
                    if (currentRecipe==null) {
                        report("Subrecipe without Recipe ($lineNo): $line")
                        return@forEach
                    }
                    val subName = mutableListOf(columns[1])
                    subrecipesToAdd.merge(
                        currentRecipe!!.name,
                        subName
                    ) { oldMapping, subs -> (oldMapping + subs).distinct() }
                }

                line.startsWith("Attachment") -> {
                    // Add an attachment to the current recipe
                    if (columns.size < 3) {
                        report("Invalid Attachment line ($lineNo): $line")
                        return@forEach
                    }
                    if (currentRecipe==null) {
                        report("Attachment without Recipe ($lineNo): $line")
                        return@forEach
                    }
                    val fileName = columns[1].replace("\\n", "\n")
                    val fileContent = String(Base64.getDecoder().decode(columns[2]))
                    currentRecipe?.attachments?.add(
                        Attachment(
                            fileName = columns[1].replace("\\n", "\n"),
                            fileContent = String(Base64.getDecoder().decode(columns[2]))
                        )
                    )
                }

                line.startsWith("Conversion") -> {
                    if (columns.size < 4) {
                        report("Invalid Conversion line ($lineNo): $line")
                        return@forEach
                    }
                    val fromMeasure = columns[1]
                    val toMeasure = columns[2]
                    val factor = columns[3].toFloat()
                    val description = columns.getOrNull(4)?.replace("\\n", "\n")

                    val existingConversion = conversionRepository.findByFromMeasureAndToMeasure(fromMeasure, toMeasure)
                    if (existingConversion != null) {
                        existingConversion.factor = factor
                        existingConversion.description = description
                        conversionRepository.save(existingConversion)
                    } else {
                        conversionRepository.save(
                            Conversion(
                                fromMeasure = fromMeasure,
                                toMeasure = toMeasure,
                                factor = factor,
                                description = description
                            )
                        )
                    }
                }
                line.startsWith("Temperature") -> {
                    if (columns.size < 3) {
                        report("Invalid Temperature line ($lineNo): $line")
                        return@forEach
                    }
                    val temp = columns[1].toFloat()
                    val meat = columns[2]
                    val description = columns.getOrNull(3)?.replace("\\n", "\n")

                    val existingTemperature = temperatureRepository.findByTempAndMeatAndDescription(temp, meat, description)
                    if (existingTemperature != null) {
                        existingTemperature.temp = temp
                        existingTemperature.meat = meat
                        existingTemperature.description = description
                        temperatureRepository.save(existingTemperature)
                    } else {
                        temperatureRepository.save(Temperature(temp = temp, meat = meat, description = description))
                    }
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
                if (subrecipes.size != subrecipeNames.size) {
                    val missingNames = subrecipeNames.toSet() - subrecipes.map { it.name }.toSet()
                    report("Warning: In recipe '${recipe.name}', the following subrecipes were not found: ${missingNames.joinToString(", ")}")
                }
                recipe.subrecipes.addAll(subrecipes)
                recipeService.saveRecipe(recipe)
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
            append("# 'Source'\tName\tAuthors\tInfo\tTitle?\n")
            append("# 'Recipe'\tName\tIsSubrecipe:bool\tPeople:int\tRating?:0-6\tServed?\tInstructions?\tClosing?\tNotes?\tSource?\tPageRef?\tWineTips?\tMatchFor?\n")
            append("# 'Ingredient'\tPreamble?\tAmount?:float\tMeasure?\tPrefix?\tName\tInstruction?\n")
            append("# 'Subrecipe'\tName\n")
            append("# 'Attachment'\tFileName\tBase64Content\n")
            append("# 'Conversion'\tFrom\tTo\tFactor\tDescription?\n")
            append("# 'Temperature'\tTemp (C)\tMeat\tDescription?\n")
            append("\n\n####################\n\n")

            recipes.forEach { recipe ->
                append("\n")
                sources.find { src -> src.id == recipe.sourceId }?.let { source ->
                    append("Source\t${source.name}\t${source.authors.replace("\n", "\\n")}\t${
                        source.info?.replace("\n", "\\n") ?: ""}\t${
                        source.title?.replace("\n", "\\n") ?: ""}\n")
                    sources.remove(source)
                }
                append("Recipe\t${recipe.name
                    }\t${recipe.subrecipe
                    }\t${recipe.people
                    }\t${recipe.rating ?: ""
                    }\t${recipe.served?.replace("\n", "\\n") ?: ""
                    }\t${recipe.instructions?.replace("\n", "\\n") ?: ""
                    }\t${recipe.closing?.replace("\n",  "\\n") ?: ""
                    }\t${recipe.notes?.replace("\n",  "\\n") ?: ""
                    }\t${recipe.source?.name ?: ""
                    }\t${recipe.pageRef?.replace("\n", "\\n") ?: ""
                    }\t${recipe.wineTips?.replace("\n", "\\n") ?: ""
                    }\t${recipe.matchFor?.replace("\n", "\\n") ?: ""
                    }\t${recipe.categories ?: ""
                    }\n"
                )

                recipe.subrecipes.forEach { subrecipe ->
                    append("Subrecipe\t${subrecipe.name.replace("\n", "\\n")}\n")
                }

                recipe.ingredients.forEach { ingredient ->
                    val amount = ingredient.amount?.toString()?.replace(Regex("""(\.\d*?)0+$"""),
                        "$1")?.replace(Regex("""\.$"""), "") ?: ""
                    append("Ingredient\t${ingredient.preamble?.replace("\n", "\\n")  ?: ""
                        }\t${amount
                        }\t${ingredient.measure?.replace("\n", "\\n") ?: ""
                        }\t${ingredient.prefix?.replace("\n", "\\n") ?: ""
                        }\t${ingredient.name.replace("\n", "\\n")
                        }\t${ingredient.instruction?.replace("\n", "\\n") ?: ""}\n"
                    )
                }

                recipe.attachments.forEach { attachment ->
                    val base64Data = Base64.getEncoder().encodeToString(attachment.fileContent.toByteArray())
                    append("Attachment\t${attachment.fileName.replace("\n", "\\n")}\t$base64Data\n")
                }
            }
            append("\n\n####################\n\n")
            sources.forEach { source ->
                append("Source\t${source.name}\t${source.authors.replace("\n", "\\n")}\t${
                    source.info?.replace("\n", "\\n") ?: ""}\t${
                    source.title?.replace("\n", "\\n") ?: ""}\n")
            }
            append("\n\n####################\n\n")
            conversionRepository.findAll().forEach { conversion ->
                append("Conversion\t${conversion.fromMeasure}\t${conversion.toMeasure}\t${conversion.factor}\t${
                    conversion.description?.replace("\n", "\\n") ?: ""}\n")
            }
            append("\n\n####################\n\n")
            temperatureRepository.findAll().forEach { temperature ->
                append("Temperature\t${temperature.temp}\t${temperature.meat}\t${
                    temperature.description?.replace("\n", "\\n") ?: ""}\n")
            }
        }

        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .body(csvContent)
    }

    @PostMapping("/shopping-list")
    fun createShoppingList(@RequestBody request: ShoppingListRequest): List<ShoppingListItem> {
        val recipeIds = request.recipeIds
        val guests = request.guests
        return recipeService.generateShoppingList(recipeIds, guests)
    }

    data class ShoppingListRequest(
        val recipeIds: List<Long>,
        val guests: Int
    )
}
