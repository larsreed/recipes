package net.kalars.recipes.controller

import io.restassured.RestAssured
import io.restassured.http.ContentType
import net.kalars.recipes.model.Temperature
import net.kalars.recipes.repository.TemperatureRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class TemperatureControllerTest {

    @LocalServerPort
    private var port: Int = 0

    @MockBean
    lateinit var temperatureRepository: TemperatureRepository

    @BeforeEach
    fun setup() {
        RestAssured.port = port
        Mockito.reset(temperatureRepository)
    }

    @Test
    fun `should fetch all temperatures`() {
        val temperatures = listOf(
            Temperature(id = 1, temp = 55.0f, meat = "Rare"),
            Temperature(id = 2, temp = 65.0f, meat = "Medium")
        )
        Mockito.`when`(temperatureRepository.findAll()).thenReturn(temperatures)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .get("/api/temperatures")
            .then()
            .statusCode(200)
            .body("[0].meat", org.hamcrest.Matchers.equalTo("Rare"))
            .body("[0].temp", org.hamcrest.Matchers.equalTo(55.0f))
            .body("[1].meat", org.hamcrest.Matchers.equalTo("Medium"))
            .body("[1].temp", org.hamcrest.Matchers.equalTo(65.0f))

        Mockito.verify(temperatureRepository).findAll()
    }

    @Test
    fun `should add a temperature`() {
        val temperature = Temperature(id = 1, temp = 55.0f, meat = "Rare")
        val temperatureJson = """
            {
                "temp": 55.0,
                "meat": "Rare"
            }
        """.trimIndent()

        Mockito.`when`(temperatureRepository.save(Mockito.any(Temperature::class.java))).thenReturn(temperature)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(temperatureJson)
            .post("/api/temperatures")
            .then()
            .statusCode(200)
            .body("meat", org.hamcrest.Matchers.equalTo("Rare"))
            .body("temp", org.hamcrest.Matchers.equalTo(55.0f))

        Mockito.verify(temperatureRepository).save(Mockito.any(Temperature::class.java))
    }

    @Test
    fun `should update a temperature`() {
        val existingTemperature = Temperature(id = 1, temp = 55.0f, meat = "Rare")
        val updatedTemperature = Temperature(id = 1, temp = 60.0f, meat = "Medium Rare")
        val updatedTemperatureJson = """
            {
                "temp": 60.0,
                "meat": "Medium Rare"
            }
        """.trimIndent()

        Mockito.`when`(temperatureRepository.findById(1L)).thenReturn(java.util.Optional.of(existingTemperature))
        Mockito.`when`(temperatureRepository.save(Mockito.any(Temperature::class.java))).thenReturn(updatedTemperature)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(updatedTemperatureJson)
            .put("/api/temperatures/1")
            .then()
            .statusCode(200)
            .body("meat", org.hamcrest.Matchers.equalTo("Medium Rare"))
            .body("temp", org.hamcrest.Matchers.equalTo(60.0f))

        Mockito.verify(temperatureRepository).findById(1L)
        Mockito.verify(temperatureRepository).save(Mockito.any(Temperature::class.java))
    }

    @Test
    fun `should delete a temperature`() {
        Mockito.doNothing().`when`(temperatureRepository).deleteById(1L)

        RestAssured.given()
            .contentType(ContentType.JSON)
            .delete("/api/temperatures/1")
            .then()
            .statusCode(200)

        Mockito.verify(temperatureRepository).deleteById(1L)
    }
}
