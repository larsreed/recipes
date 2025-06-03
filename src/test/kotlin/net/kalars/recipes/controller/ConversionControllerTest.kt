package net.kalars.recipes.controller

import io.restassured.RestAssured
import io.restassured.http.ContentType
import net.kalars.recipes.model.Conversion
import net.kalars.recipes.repository.ConversionRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class ConversionControllerTest {

    @LocalServerPort
    private var port: Int = 33

    @MockBean
    lateinit var conversionRepository: ConversionRepository

    @BeforeEach
    fun setup() {
        RestAssured.port = port
        Mockito.reset(conversionRepository)
    }

    @Test
    fun `should fetch all conversions`() {
        val conversions = listOf(
            Conversion(id = 1, factor = 240.0f, fromMeasure = "cup", toMeasure = "ml"),
            Conversion(id = 2, factor = 15.0f, fromMeasure = "tbsp", toMeasure = "ml")
        )
        Mockito.`when`(conversionRepository.findAll()).thenReturn(conversions)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .get("/api/conversions")
            .then()
            .statusCode(200)
            .body("[0].fromMeasure", org.hamcrest.Matchers.equalTo("cup"))
            .body("[0].toMeasure", org.hamcrest.Matchers.equalTo("ml"))
            .body("[0].factor", org.hamcrest.Matchers.equalTo(240.0f))
            .body("[1].fromMeasure", org.hamcrest.Matchers.equalTo("tbsp"))
            .body("[1].toMeasure", org.hamcrest.Matchers.equalTo("ml"))
            .body("[1].factor", org.hamcrest.Matchers.equalTo(15.0f))

        Mockito.verify(conversionRepository).findAll()
    }

    @Test
    fun `should add a conversion`() {
        val conversion = Conversion(id = 1, factor = 240.0f, fromMeasure = "cup", toMeasure = "ml")
        val conversionJson = """
            {
                "fromMeasure": "cup",
                "toMeasure": "ml",
                "factor": 240.0
            }
        """.trimIndent()

        Mockito.`when`(conversionRepository.save(Mockito.any(Conversion::class.java))).thenReturn(conversion)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(conversionJson)
            .post("/api/conversions")
            .then()
            .statusCode(200)
            .body("fromMeasure", org.hamcrest.Matchers.equalTo("cup"))
            .body("toMeasure", org.hamcrest.Matchers.equalTo("ml"))
            .body("factor", org.hamcrest.Matchers.equalTo(240.0f))

        Mockito.verify(conversionRepository).save(Mockito.any(Conversion::class.java))
    }

    @Test
    fun `should update a conversion`() {
        val existingConversion = Conversion(id = 1, factor = 240.0f, fromMeasure = "cup", toMeasure = "ml")
        val updatedConversion = Conversion(id = 1, factor = 250.0f, fromMeasure = "cup", toMeasure = "ml")
        val updatedConversionJson = """
            {
                "fromMeasure": "cup",
                "toMeasure": "ml",
                "factor": 250.0
            }
        """.trimIndent()

        Mockito.`when`(conversionRepository.findById(1L)).thenReturn(java.util.Optional.of(existingConversion))
        Mockito.`when`(conversionRepository.save(Mockito.any(Conversion::class.java))).thenReturn(updatedConversion)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(updatedConversionJson)
            .put("/api/conversions/1")
            .then()
            .statusCode(200)
            .body("fromMeasure", org.hamcrest.Matchers.equalTo("cup"))
            .body("toMeasure", org.hamcrest.Matchers.equalTo("ml"))
            .body("factor", org.hamcrest.Matchers.equalTo(250.0f))

        Mockito.verify(conversionRepository).findById(1L)
        Mockito.verify(conversionRepository).save(Mockito.any(Conversion::class.java))
    }

    @Test
    fun `should delete a conversion`() {
        Mockito.doNothing().`when`(conversionRepository).deleteById(1L)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .delete("/api/conversions/1")
            .then()
            .statusCode(200)

        Mockito.verify(conversionRepository).deleteById(1L)
    }
}
