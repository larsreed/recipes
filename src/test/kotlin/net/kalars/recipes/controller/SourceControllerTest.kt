package net.kalars.recipes.controller

import io.restassured.RestAssured
import io.restassured.http.ContentType
import net.kalars.recipes.model.Source
import net.kalars.recipes.repository.SourceRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles
import java.util.*

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SourceControllerTest {

    @LocalServerPort
    private var port: Int = 0

    @MockBean
    lateinit var sourceRepository: SourceRepository

    @BeforeEach
    fun setup() {
        RestAssured.port = port
        Mockito.reset(sourceRepository)
    }

    @Test
    fun `should fetch all sources`() {
        val sources = listOf(
            Source(id = 1, name = "Book A", authors = "Author 1"),
            Source(id = 2, name = "Book B", authors = "Author 2")
        )
        Mockito.`when`(sourceRepository.findAll()).thenReturn(sources)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .get("/api/sources")
            .then()
            .statusCode(200)
            .body("[0].name", org.hamcrest.Matchers.equalTo("Book A"))
            .body("[0].authors", org.hamcrest.Matchers.equalTo("Author 1"))
            .body("[1].name", org.hamcrest.Matchers.equalTo("Book B"))
            .body("[1].authors", org.hamcrest.Matchers.equalTo("Author 2"))

        Mockito.verify(sourceRepository).findAll()
    }

    @Test
    fun `should add a source`() {
        val source = Source(id = 1, name = "Book A", authors = "Author 1")
        val sourceJson = """
            {
                "name": "Book A",
                "authors": "Author 1"
            }
        """.trimIndent()

        Mockito.`when`(sourceRepository.save(Mockito.any(Source::class.java))).thenReturn(source)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(sourceJson)
            .post("/api/sources")
            .then()
            .statusCode(201)
            .body("name", org.hamcrest.Matchers.equalTo("Book A"))
            .body("authors", org.hamcrest.Matchers.equalTo("Author 1"))

        Mockito.verify(sourceRepository).save(Mockito.any(Source::class.java))
    }

    @Test
    fun `should update a source`() {
        val existingSource = Source(id = 1, name = "Book A", authors = "Author 1")
        val updatedSource = Source(id = 1, name = "Book B", authors = "Author 2")
        val updatedSourceJson = """
            {
                "name": "Book B",
                "authors": "Author 2"
            }
        """.trimIndent()

        Mockito.`when`(sourceRepository.findById(1L)).thenReturn(Optional.of(existingSource))
        Mockito.`when`(sourceRepository.save(Mockito.any(Source::class.java))).thenReturn(updatedSource)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(updatedSourceJson)
            .put("/api/sources/1")
            .then()
            .statusCode(200)
            .body("name", org.hamcrest.Matchers.equalTo("Book B"))
            .body("authors", org.hamcrest.Matchers.equalTo("Author 2"))

        Mockito.verify(sourceRepository).findById(1L)
        Mockito.verify(sourceRepository).save(Mockito.any(Source::class.java))
    }

    @Test
    fun `should delete a source`() {
        Mockito.doNothing().`when`(sourceRepository).deleteById(1L)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .delete("/api/sources/1")
            .then()
            .statusCode(204)

        Mockito.verify(sourceRepository).deleteById(1L)
    }

    @Test
    fun `should check if source name exists excluding id`() {
        Mockito.`when`(sourceRepository.existsByNameAndIdNot("Book A", 1L)).thenReturn(true)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .param("name", "Book A")
            .param("id", 1L)
            .get("/api/sources/check-name")
            .then()
            .statusCode(200)
            .body("exists", org.hamcrest.Matchers.equalTo(true))

        Mockito.verify(sourceRepository).existsByNameAndIdNot("Book A", 1L)
    }
}
