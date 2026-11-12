package net.kalars.recipes.service

import com.fasterxml.jackson.databind.ObjectMapper
import net.kalars.recipes.model.Attachment
import net.kalars.recipes.model.Conversion
import net.kalars.recipes.model.Ingredient
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.Temperature
import net.kalars.recipes.repository.ConversionRepository
import net.kalars.recipes.repository.TemperatureRepository
import org.springframework.stereotype.Service
import java.io.InputStream
import java.util.Base64

data class RecipeImportResponse(
    val recipes: List<Recipe>,
    val warnings: List<String>
)

@Service
class RecipeImportService(
    private val recipeService: RecipeService,
    private val sourceService: SourceService,
    private val conversionRepository: ConversionRepository,
    private val temperatureRepository: TemperatureRepository
) {
    private val decimalCommaRegex = Regex("(?<!\\d)(-?\\d+),(\\d+)(?!\\d)")

    /** Imports tab-separated records (see the export format). Throws IllegalArgumentException on duplicate names. */
    fun importRecipes(content: String): RecipeImportResponse = ImportSession().run(content)

    /** Adds ingredients from a delimited file (header line skipped) to the given recipe JSON. */
    fun importIngredients(recipeJson: String, input: InputStream): Recipe {
        val recipe = ObjectMapper().readValue(recipeJson, Recipe::class.java)
        input.bufferedReader().lineSequence().drop(1).forEach { line ->
            val columns = line.split(",", ";", "\t")
            if (columns.size != 6) {
                report("Invalid ingredient line: $line")
            } else {
                recipe.ingredients.add(
                    Ingredient(
                        preamble = columns[0],
                        amount = columns[1].toFloatOrNull(),
                        measure = columns[2],
                        prefix = columns[3],
                        name = columns[4],
                        instruction = columns[5]
                    )
                )
            }
        }
        return recipeService.updateRecipe(recipe.id, recipe)
    }

    private fun report(message: String) = System.err.println(message)

    private fun normalizeLine(line: String): String =
        decimalCommaRegex.replace(line.trimEnd()) { "${it.groupValues[1]}.${it.groupValues[2]}" }

    private fun normalizeCellForMarker(cell: String): String =
        cell.replace('\u00A0', ' ').trim().trim('"')

    private fun String.unescapeNewlines() = replace("\\n", "\n")

    private fun createRecipe(recipe: Recipe, lineNo: Int): Recipe =
        try {
            recipeService.createRecipe(recipe)
        } catch (e: RuntimeException) {
            val isDuplicateName = e.message?.contains("unique", ignoreCase = true) == true
            if (isDuplicateName) {
                throw IllegalArgumentException(
                    "Import failed at line $lineNo: recipe name '${recipe.name}' already exists. " +
                        "Rename it in the import file or delete/rename the existing recipe first."
                )
            }
            throw e
        }

    /** State for one import run: the recipe being built and the links to resolve at the end. */
    private inner class ImportSession {
        private val recipes = mutableListOf<Recipe>()
        private val warnings = mutableListOf<String>()
        private val sourceIdsByName = mutableMapOf<String, Long>()
        private val subrecipeNamesByRecipe = mutableMapOf<String, List<String>>()
        private var currentRecipe: Recipe? = null
        private var currentRecipeStartLine = 0

        fun run(content: String): RecipeImportResponse {
            content.lineSequence().forEachIndexed { index, rawLine -> handleLine(rawLine, index + 1) }
            saveCurrentRecipe()
            linkSubrecipes()
            return RecipeImportResponse(recipes, warnings)
        }

        private fun handleLine(rawLine: String, lineNo: Int) {
            val line = normalizeLine(rawLine)
            val rawColumns = line.split("\t")
            val markerIndex = rawColumns.take(10)
                .indexOfFirst { normalizeCellForMarker(it) in ImportFileReader.importMarkers }
            val columns = (if (markerIndex >= 0) rawColumns.drop(markerIndex) else rawColumns).toMutableList()
            while (columns.size < 100) columns.add("")
            val nonBlankCount = columns.indexOfLast { it.isNotBlank() } + 1
            val recordType = normalizeCellForMarker(columns[0])

            if (recordType.isBlank() || recordType.startsWith("#")) return

            val ctx = Record(columns, nonBlankCount, lineNo, line)
            when (recordType.lowercase()) {
                "source" -> handleSource(ctx)
                "recipe" -> handleRecipe(ctx)
                "ingredient" -> handleIngredient(ctx)
                "subrecipe" -> handleSubrecipe(ctx)
                "attachment" -> handleAttachment(ctx)
                "conversion" -> handleConversion(ctx)
                "temperature" -> handleTemperature(ctx)
            }
        }

        private inner class Record(val columns: List<String>, val nonBlankCount: Int, val lineNo: Int, val line: String) {
            operator fun get(index: Int) = columns[index]

            /** Reports and returns false when the line has too few columns. */
            fun requireColumns(count: Int, type: String): Boolean {
                if (nonBlankCount >= count) return true
                report("Invalid $type line ($lineNo): $line")
                return false
            }

            /** Returns the current recipe, or reports and returns null when none has been started. */
            fun requireRecipe(type: String): Recipe? =
                currentRecipe ?: run {
                    report("$type without Recipe ($lineNo): $line")
                    null
                }
        }

        private fun handleSource(r: Record) {
            if (!r.requireColumns(3, "Source")) return
            val sourceName = r[1]
            val source = sourceService.createOrGetSource(
                sourceName,
                r[2].unescapeNewlines(),
                r[3].unescapeNewlines(),
                r.columns.getOrNull(4)?.unescapeNewlines(),
                r.columns.getOrNull(5)?.trim()?.ifBlank { null }
            )
            sourceIdsByName[sourceName] = source.id
        }

        private fun saveCurrentRecipe() {
            currentRecipe?.let { recipes.add(createRecipe(it, currentRecipeStartLine)) }
        }

        private fun handleRecipe(r: Record) {
            saveCurrentRecipe()
            if (!r.requireColumns(2, "Recipe")) return

            val people = r[3].toIntOrNull()
                ?: r[3].replace(',', '.').toFloatOrNull()?.toInt()
                ?: 0
            val recipe = Recipe(
                name = r[1].trim(),
                subrecipe = r[2].toBoolean(),
                people = people,
                rating = r[4].toIntOrNull(),
                served = r[5].unescapeNewlines(),
                instructions = r[6].unescapeNewlines(),
                closing = r[7].unescapeNewlines(),
                notes = r[8].unescapeNewlines(),
                pageRef = r[10],
                wineTips = r[11].unescapeNewlines(),
                matchFor = r[12].unescapeNewlines(),
                categories = r[13],
                imageFileName = r.columns.getOrNull(14)?.trim()?.ifBlank { null }
            )
            currentRecipe = recipe
            currentRecipeStartLine = r.lineNo

            val sourceId = sourceIdsByName[r[9]]
            if (sourceId == null && r[9].isNotBlank()) {
                report("Warning: Recipe '${r[1]}' references a non-existing source '${r[9]}'.")
            }
            recipe.sourceId = sourceId
        }

        private fun handleIngredient(r: Record) {
            if (!r.requireColumns(2, "Ingredient")) return
            val recipe = r.requireRecipe("Ingredient") ?: return
            recipe.ingredients.add(
                Ingredient(
                    preamble = r[1].unescapeNewlines(),
                    amount = r[2].toFloatOrNull(),
                    measure = r[3],
                    prefix = r[4].unescapeNewlines(),
                    name = r[5].unescapeNewlines(),
                    instruction = r[6].unescapeNewlines()
                )
            )
        }

        private fun handleSubrecipe(r: Record) {
            if (!r.requireColumns(2, "Subrecipe")) return
            val recipe = r.requireRecipe("Subrecipe") ?: return
            subrecipeNamesByRecipe.merge(recipe.name, listOf(r[1].trim())) { old, new -> (old + new).distinct() }
        }

        private fun handleAttachment(r: Record) {
            if (!r.requireColumns(3, "Attachment")) return
            val recipe = r.requireRecipe("Attachment") ?: return
            recipe.attachments.add(
                Attachment(
                    fileName = r[1].unescapeNewlines(),
                    fileContent = String(Base64.getDecoder().decode(r[2]))
                )
            )
        }

        private fun handleConversion(r: Record) {
            if (!r.requireColumns(4, "Conversion")) return
            val fromMeasure = r[1]
            val toMeasure = r[2]
            val factor = r[3].toFloatOrNull()
            if (factor == null) {
                report("Invalid Conversion factor (${r.lineNo}): ${r[3]}")
                return
            }
            val description = r.columns.getOrNull(4)?.unescapeNewlines()
            val preferred = r.columns.getOrNull(5)?.toBoolean() ?: false

            val conversion = conversionRepository.findByFromMeasureAndToMeasure(fromMeasure, toMeasure)
            if (conversion != null) {
                conversion.factor = factor
                conversion.description = description
                conversion.preferred = preferred
                conversionRepository.save(conversion)
            } else {
                conversionRepository.save(
                    Conversion(
                        fromMeasure = fromMeasure,
                        toMeasure = toMeasure,
                        factor = factor,
                        description = description,
                        preferred = preferred
                    )
                )
            }
        }

        private fun handleTemperature(r: Record) {
            if (!r.requireColumns(3, "Temperature")) return
            val temp = r[1].toFloatOrNull()
            if (temp == null) {
                report("Invalid Temperature value (${r.lineNo}): ${r[1]}")
                return
            }
            val meat = r[2]
            val description = r.columns.getOrNull(3)?.unescapeNewlines()

            val existing = temperatureRepository.findByTempAndMeatAndDescription(temp, meat, description)
            if (existing != null) {
                existing.temp = temp
                existing.meat = meat
                existing.description = description
                temperatureRepository.save(existing)
            } else {
                temperatureRepository.save(Temperature(temp = temp, meat = meat, description = description))
            }
        }

        private fun linkSubrecipes() {
            recipes.forEach { recipe ->
                val subrecipeNames = subrecipeNamesByRecipe[recipe.name] ?: return@forEach
                val subrecipes = subrecipeNames.mapNotNull { name -> recipes.find { it.name == name } }
                if (subrecipes.size != subrecipeNames.size) {
                    val missing = subrecipeNames.toSet() - subrecipes.map { it.name }.toSet()
                    val warning = "Warning: In recipe '${recipe.name}', the following subrecipes were not found: ${missing.joinToString(", ")}"
                    warnings.add(warning)
                    report(warning)
                }
                recipe.subrecipes.addAll(subrecipes)
                recipeService.saveRecipe(recipe)
            }
        }
    }
}
