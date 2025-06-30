package net.kalars.recipes.controller

import io.restassured.RestAssured
import io.restassured.http.ContentType
import net.kalars.recipes.model.Attachment
import net.kalars.recipes.model.Recipe
import net.kalars.recipes.model.ShoppingListItem
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.ConversionRepository
import net.kalars.recipes.repository.TemperatureRepository
import net.kalars.recipes.service.RecipeService
import net.kalars.recipes.service.SourceService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.mockito.Mockito.any
import org.mockito.Mockito.eq
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class RecipeControllerTest {

    @LocalServerPort
    private var port: Int = 0

    @MockBean
    lateinit var recipeService: RecipeService

    @MockBean
    lateinit var sourceService: SourceService

    @MockBean
    lateinit var conversionRepository: ConversionRepository

    @MockBean
    lateinit var temperatureRepository: TemperatureRepository

    @BeforeEach
    fun setup() {
        RestAssured.port = port
        Mockito.reset(recipeService, sourceService)
    }

    @Test
    fun `should fetch all recipes`() {
        val recipes = listOf(
            Recipe(id = 1, name = "Pasta", people = 2, instructions = "Boil pasta"),
            Recipe(id = 2, name = "Salad", people = 4, instructions = "Mix veggies")
        )
        Mockito.`when`(recipeService.getAllRecipes()).thenReturn(recipes)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .param("includeSubrecipes", true)
            .get("/api/recipes")
            .then()
            .statusCode(200)
            .body("[0].name", org.hamcrest.Matchers.equalTo("Pasta"))
            .body("[1].name", org.hamcrest.Matchers.equalTo("Salad"))

        Mockito.verify(recipeService).getAllRecipes()
    }

    @Test
    fun `should add a recipe`() {
        val recipe = Recipe(id = 1, name = "Pasta", people = 2, instructions = "Boil pasta")
        val recipeJson = """
            {
                "name": "Pasta",
                "people": 2,
                "instructions": "Boil pasta",
                "ingredients": []
            }
        """.trimIndent()

        Mockito.`when`(recipeService.createRecipe(any(Recipe::class.java) ?: Recipe())).thenReturn(recipe)


        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(recipeJson)
            .post("/api/recipes")
            .then()
            .statusCode(200)
            .body("name", org.hamcrest.Matchers.equalTo("Pasta"))

        Mockito.verify(recipeService).createRecipe(any(Recipe::class.java) ?: Recipe())
    }

    @Test
    fun `should update a recipe`() {
        val updatedRecipe = Recipe(id = 1, name = "Pasta Bolognese", people = 2, instructions = "Boil pasta, add sauce")
        val updatedRecipeJson = """
            {
                "name": "Pasta Bolognese",
                "people": 2,
                "instructions": "Boil pasta, add sauce",
                "ingredients": []
            }
        """.trimIndent()

        Mockito.`when`(recipeService.updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())).thenReturn(updatedRecipe)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(updatedRecipeJson)
            .put("/api/recipes/1")
            .then()
            .statusCode(200)
            .body("name", org.hamcrest.Matchers.equalTo("Pasta Bolognese"))

        Mockito.verify(recipeService).updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())
    }

    @Test
    fun `should delete a recipe`() {
        Mockito.doNothing().`when`(recipeService).deleteRecipe(1L)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .delete("/api/recipes/1")
            .then()
            .statusCode(200)

        Mockito.verify(recipeService).deleteRecipe(1L)
    }

    @Test
    fun `should get main recipes referencing subrecipe`() {
        val recipes = listOf(Recipe(id = 1, name = "Main", people = 2, instructions = ""))
        Mockito.`when`(recipeService.findBySubrecipesId(10L)).thenReturn(recipes)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .get("/api/recipes/references/10")
            .then()
            .statusCode(200)
            .body("[0].id", org.hamcrest.Matchers.equalTo(1))

        Mockito.verify(recipeService).findBySubrecipesId(10L)
    }

    @Test
    fun `should add attachment to recipe`() {
        val fileContent = "test content".toByteArray()
        val fileName = "test.txt"
        val recipe = Recipe(id = 1, name = "Pasta", people = 2, instructions = "", attachments = mutableListOf())
        Mockito.`when`(recipeService.getRecipeById(1L)).thenReturn(recipe)
        Mockito.`when`(recipeService.updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())).thenReturn(recipe)

        RestAssured.given()
            .multiPart("file", fileName, fileContent)
            .post("/api/recipes/1/attachments")
            .then()
            .statusCode(200)

        Mockito.verify(recipeService).getRecipeById(1L)
        Mockito.verify(recipeService).updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())
    }

    @Test
    fun `should delete attachment from recipe`() {
        val recipe = Recipe(id = 1, name = "Pasta", people = 2, instructions = "", attachments = mutableListOf(
            Attachment(id = 2, fileName = "a.txt", fileContent = "")
        ))
        Mockito.`when`(recipeService.getRecipeById(1L)).thenReturn(recipe)
        Mockito.`when`(recipeService.updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())).thenReturn(recipe)

        RestAssured.given()
            .delete("/api/recipes/1/attachments/2")
            .then()
            .statusCode(200)

        Mockito.verify(recipeService).getRecipeById(1L)
        Mockito.verify(recipeService).updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())
    }

    @Test
    fun `should nullify source in recipes`() {
        Mockito.doNothing().`when`(recipeService).nullifySourceInRecipes(5L)

        RestAssured.given()
            .put("/api/recipes/nullify-source/5")
            .then()
            .statusCode(200)

        Mockito.verify(recipeService).nullifySourceInRecipes(5L)
    }

    @Test
    fun `should search recipes by query`() {
        val recipes = listOf(Recipe(id = 1, name = "Cake", people = 2, instructions = "Bake"))
        Mockito.`when`(recipeService.getAllRecipes()).thenReturn(recipes)

        RestAssured.given()
            .param("query", "Cake")
            .get("/api/recipes/search")
            .then()
            .statusCode(200)
            .body("[0].name", org.hamcrest.Matchers.equalTo("Cake"))

        Mockito.verify(recipeService).getAllRecipes()
    }

    @Test
    fun `should import ingredients from file`() {
        val recipe = Recipe(id = 1, name = "Soup", people = 2, instructions = "", ingredients = mutableListOf())
        Mockito.`when`(recipeService.updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())).thenReturn(recipe)

        val csv = "preamble,amount,measure,prefix,name,instruction\n,,g,Carrot,Chop"
        val recipeJson = """{"id":1,"name":"Soup","people":2,"instructions":"","ingredients":[]}"""

        RestAssured.given()
            .multiPart("file", "ingredients.csv", csv.toByteArray())
            .multiPart("recipe", recipeJson)
            .post("/api/recipes/import-ingredients")
            .then()
            .statusCode(200)
            .body("name", org.hamcrest.Matchers.equalTo("Soup"))

        Mockito.verify(recipeService).updateRecipe(eq(1L), any(Recipe::class.java) ?: Recipe())
    }

    @Test
    fun `should export all recipes as csv`() {
        val recipes = listOf(Recipe(id = 1, name = "Cake", people = 2, instructions = "Bake"))
        val sources = listOf(Source(id = 1, name = "Book", authors = "Author"))
        Mockito.`when`(recipeService.getAllRecipes()).thenReturn(recipes)
        Mockito.`when`(sourceService.getAllSources()).thenReturn(sources)
        Mockito.`when`(conversionRepository.findAll()).thenReturn(emptyList())
        Mockito.`when`(temperatureRepository.findAll()).thenReturn(emptyList())

        RestAssured.given()
            .contentType(ContentType.JSON)
            .post("/api/recipes/export-all")
            .then()
            .statusCode(200)
            .header("Content-Type", org.hamcrest.Matchers.containsString("text/csv"))
            .body(org.hamcrest.Matchers.containsString("Cake"))
    }

    @Test
    fun `should export specific recipes as csv`() {
        val recipes = listOf(Recipe(id = 1, name = "Cake", people = 2, instructions = "Bake"))
        Mockito.`when`(recipeService.getRecipesByIds(listOf(1L))).thenReturn(recipes)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body("[1]")
            .post("/api/recipes/export-all")
            .then()
            .statusCode(200)
            .header("Content-Type", org.hamcrest.Matchers.containsString("text/csv"))
            .body(org.hamcrest.Matchers.containsString("Cake"))

        Mockito.verify(recipeService).getRecipesByIds(listOf(1L))
    }

    @Test
    fun `should create shopping list for multiple recipes`() {
        val items = listOf(
            ShoppingListItem(name = "Flour", amount = 1.0f, measure = "kg"),
            ShoppingListItem(name = "Sugar", amount = 0.5f, measure = "kg")
        )
        Mockito.`when`(recipeService.generateShoppingList(listOf(1L, 2L), 4)).thenReturn(items)

        val requestJson = """
        {"recipeIds":[1,2],"guests":4}
    """.trimIndent()

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(requestJson)
            .post("/api/recipes/shopping-list")
            .then()
            .statusCode(200)
            .body("[0].name", org.hamcrest.Matchers.equalTo("Flour"))
            .body("[1].name", org.hamcrest.Matchers.equalTo("Sugar"))

        Mockito.verify(recipeService).generateShoppingList(listOf(1L, 2L), 4)
    }

    @Test
    fun `should fetch recipes including subrecipes`() {
        val recipes = listOf(Recipe(id = 1, name = "Pasta", people = 2, instructions = "Boil pasta"))
        Mockito.`when`(recipeService.getAllRecipes()).thenReturn(recipes)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .param("includeSubrecipes", true)
            .get("/api/recipes")
            .then()
            .statusCode(200)
            .body("[0].name", org.hamcrest.Matchers.equalTo("Pasta"))

        Mockito.verify(recipeService).getAllRecipes()
    }

    @Test
    fun `should fetch main recipes only`() {
        val recipes = listOf(Recipe(id = 1, name = "Salad", people = 4, instructions = "Mix veggies"))
        Mockito.`when`(recipeService.getMainRecipes()).thenReturn(recipes)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .param("includeSubrecipes", false)
            .get("/api/recipes")
            .then()
            .statusCode(200)
            .body("[0].name", org.hamcrest.Matchers.equalTo("Salad"))

        Mockito.verify(recipeService).getMainRecipes()
    }
}
