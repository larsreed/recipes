package net.kalars.recipes.controller

import net.kalars.recipes.model.Attachment
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.ShoppingListItem
import net.kalars.recipes.service.ImportFileReader
import net.kalars.recipes.service.MediaService
import net.kalars.recipes.service.RecipeExportService
import net.kalars.recipes.service.RecipeImportService
import net.kalars.recipes.service.RecipeSearchService
import net.kalars.recipes.service.RecipeService
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.util.Base64

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = ["\${frontend.url}"])
class RecipeController(
    private val recipeService: RecipeService,
    private val recipeSearchService: RecipeSearchService,
    private val recipeImportService: RecipeImportService,
    private val recipeExportService: RecipeExportService,
    private val mediaService: MediaService
) {

    private fun saveOrBadRequest(save: () -> Recipe): ResponseEntity<Any> =
        try {
            ResponseEntity.ok(save())
        } catch (e: RuntimeException) {
            val errorMsg = if (e.message?.contains("unique") == true) {
                "A recipe with this name already exists. Please choose a different name."
            } else {
                e.message ?: "Unknown error occurred."
            }
            ResponseEntity.badRequest().body(mapOf("error" to errorMsg))
        }

    @GetMapping
    fun getRecipes(@RequestParam includeSubrecipes: Boolean): List<Recipe> =
        if (includeSubrecipes) recipeService.getAllRecipes() else recipeService.getMainRecipes()

    @GetMapping("/references/{subrecipeId}")
    fun getMainRecipesReferencingSubrecipe(@PathVariable subrecipeId: Long): List<Recipe> =
        recipeService.findBySubrecipesId(subrecipeId)

    @PostMapping
    fun createRecipe(@RequestBody recipe: Recipe): ResponseEntity<Any> =
        saveOrBadRequest { recipeService.createRecipe(recipe) }

    @PutMapping("/{id}")
    fun updateRecipe(@PathVariable id: Long, @RequestBody recipe: Recipe): ResponseEntity<Any> =
        saveOrBadRequest { recipeService.updateRecipe(id, recipe) }

    @DeleteMapping("/{id}")
    fun deleteRecipe(@PathVariable id: Long) = recipeService.deleteRecipe(id)

    @PostMapping("/delete-many")
    fun deleteRecipes(@RequestBody ids: List<Long>): ResponseEntity<Void> {
        recipeService.deleteRecipesByIds(ids)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/nullify-source/{sourceId}")
    fun nullifySourceInRecipes(@PathVariable sourceId: Long) = recipeService.nullifySourceInRecipes(sourceId)

    @PostMapping("/{id}/attachments")
    fun addAttachment(@PathVariable id: Long, @RequestParam("file") file: MultipartFile): Recipe {
        val recipe = recipeService.getRecipeById(id)
        recipe.attachments.add(
            Attachment(
                fileName = file.originalFilename ?: "unknown",
                fileContent = Base64.getEncoder().encodeToString(file.bytes)
            )
        )
        return recipeService.updateRecipe(id, recipe)
    }

    @DeleteMapping("/{recipeId}/attachments/{attachmentId}")
    fun deleteAttachment(@PathVariable recipeId: Long, @PathVariable attachmentId: Long): Recipe {
        val recipe = recipeService.getRecipeById(recipeId)
        recipe.attachments.removeIf { it.id == attachmentId }
        return recipeService.updateRecipe(recipeId, recipe)
    }

    @GetMapping("/search")
    fun searchRecipes(@RequestParam query: String): List<Recipe> = recipeSearchService.search(query)

    @GetMapping("/media/{fileName:.+}")
    fun getMediaFile(@PathVariable fileName: String): ResponseEntity<Resource> {
        if (fileName.contains("/") || fileName.contains("\\") || fileName.contains("..")) {
            return ResponseEntity.badRequest().build()
        }
        val mediaFile = mediaService.resolveMediaFile(fileName) ?: return ResponseEntity.notFound().build()

        val contentType = Files.probeContentType(mediaFile)
            ?.let { MediaType.parseMediaType(it) }
            ?: MediaType.APPLICATION_OCTET_STREAM

        return ResponseEntity.ok()
            .contentType(contentType)
            .body(FileSystemResource(mediaFile))
    }

    @GetMapping("/media-files")
    fun listMediaFiles(): List<String> = mediaService.listImageFiles()

    @PostMapping("/import-ingredients")
    fun importIngredients(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("recipe") recipeJson: String
    ): Recipe = recipeImportService.importIngredients(recipeJson, file.inputStream)

    @PostMapping("/import")
    fun importRecipes(@RequestParam("file") file: MultipartFile): ResponseEntity<Any> =
        try {
            val content = ImportFileReader.readContent(file.bytes)
            ResponseEntity.ok(recipeImportService.importRecipes(content))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(e.message ?: "Import failed")
        }

    @PostMapping("/export-all")
    fun exportRecipes(@RequestBody(required = false) recipeIds: List<Long>?): ResponseEntity<String> =
        ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .body(recipeExportService.exportAsText(recipeIds))

    @PostMapping("/shopping-list")
    fun createShoppingList(@RequestBody request: ShoppingListRequest): List<ShoppingListItem> =
        recipeService.generateShoppingList(request.recipeIds, request.guests)

    data class ShoppingListRequest(
        val recipeIds: List<Long>,
        val guests: Int
    )
}
