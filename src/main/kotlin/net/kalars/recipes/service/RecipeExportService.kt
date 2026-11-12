package net.kalars.recipes.service

import net.kalars.recipes.model.Ingredient
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.ConversionRepository
import net.kalars.recipes.repository.TemperatureRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.Base64

/** Exports recipes in the tab-separated text format read by [RecipeImportService]. */
@Service
class RecipeExportService(
    private val recipeService: RecipeService,
    private val sourceService: SourceService,
    private val conversionRepository: ConversionRepository,
    private val temperatureRepository: TemperatureRepository
) {
    private val trailingZerosRegex = Regex("""(\.\d*?)0+$""")
    private val trailingDotRegex = Regex("""\.$""")
    private val separator = "\n\n####################\n\n"

    private fun String?.escaped() = this?.replace("\n", "\\n") ?: ""

    fun exportAsText(recipeIds: List<Long>?): String {
        val recipes = if (recipeIds.isNullOrEmpty()) {
            recipeService.getAllRecipes()
        } else {
            recipeService.getRecipesByIds(recipeIds)
        }
        // Sources are written next to their first recipe; the rest go in their own section.
        val remainingSources = sourceService.getAllSources().toMutableList()

        return buildString {
            appendHeader(recipes.size, remainingSources.size)
            append(separator)

            recipes.forEach { recipe ->
                append("\n")
                remainingSources.find { it.id == recipe.sourceId }?.let { source ->
                    appendSource(source)
                    remainingSources.remove(source)
                }
                appendRecipe(recipe)
            }

            append(separator)
            remainingSources.forEach { appendSource(it) }

            append(separator)
            conversionRepository.findAll().forEach { conversion ->
                append("Conversion\t${conversion.fromMeasure}\t${conversion.toMeasure}\t${conversion.factor}\t" +
                    "${conversion.description.escaped()}\t${conversion.preferred}\n")
            }

            append(separator)
            temperatureRepository.findAll().forEach { temperature ->
                append("Temperature\t${temperature.temp}\t${temperature.meat}\t${temperature.description.escaped()}\n")
            }
        }
    }

    private fun StringBuilder.appendHeader(recipeCount: Int, sourceCount: Int) {
        append("# Exported on ${LocalDateTime.now()}\n")
        append("# Total recipes: $recipeCount\n")
        append("# Total sources: $sourceCount\n")
        append("# Format (\\n for newline, TAB-separated)\n")
        append("# '#' Comment\n")
        append("# 'Source'\tName\tAuthors\tInfo\tTitle?\tImageFileName?\n")
        append("# 'Recipe'\tName\tIsSubrecipe:bool\tPeople:int\tRating?:0-6\tServed?\tInstructions?\tClosing?\tNotes?\tSource?\tPageRef?\tWineTips?\tMatchFor?\tCategories?\tImageFileName?\n")
        append("# 'Ingredient'\tPreamble?\tAmount?:float\tMeasure?\tPrefix?\tName\tInstruction?\n")
        append("# 'Subrecipe'\tName\n")
        append("# 'Attachment'\tFileName\tBase64Content\n")
        append("# 'Conversion'\tFrom\tTo\tFactor\tDescription?\tPreferred?:bool\n")
        append("# 'Temperature'\tTemp (C)\tMeat\tDescription?\n")
    }

    private fun StringBuilder.appendSource(source: Source) {
        append("Source\t${source.name}\t${source.authors.escaped()}\t${source.info.escaped()}\t" +
            "${source.title.escaped()}\t${source.imageFileName.escaped()}\n")
    }

    private fun StringBuilder.appendRecipe(recipe: Recipe) {
        append("Recipe\t${recipe.name}\t${recipe.subrecipe}\t${recipe.people}\t${recipe.rating ?: ""}\t" +
            "${recipe.served.escaped()}\t${recipe.instructions.escaped()}\t${recipe.closing.escaped()}\t" +
            "${recipe.notes.escaped()}\t${recipe.source?.name ?: ""}\t${recipe.pageRef.escaped()}\t" +
            "${recipe.wineTips.escaped()}\t${recipe.matchFor.escaped()}\t${recipe.categories ?: ""}\t" +
            "${recipe.imageFileName.escaped()}\n")

        recipe.subrecipes.forEach { append("Subrecipe\t${it.name.escaped()}\n") }
        recipe.ingredients.forEach { appendIngredient(it) }
        recipe.attachments.forEach { attachment ->
            val base64Data = Base64.getEncoder().encodeToString(attachment.fileContent.toByteArray())
            append("Attachment\t${attachment.fileName.escaped()}\t$base64Data\n")
        }
    }

    private fun StringBuilder.appendIngredient(ingredient: Ingredient) {
        val amount = ingredient.amount?.toString()
            ?.replace(trailingZerosRegex, "$1")
            ?.replace(trailingDotRegex, "")
            ?: ""
        append("Ingredient\t${ingredient.preamble.escaped()}\t$amount\t${ingredient.measure.escaped()}\t" +
            "${ingredient.prefix.escaped()}\t${ingredient.name.escaped()}\t${ingredient.instruction.escaped()}\n")
    }
}
