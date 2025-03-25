package net.kalars.recipes.config

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.module.SimpleModule
import net.kalars.recipes.model.RecipeListDeserializer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class JacksonConfig(
    private val recipeListDeserializer: RecipeListDeserializer
) {

    @Bean
    fun objectMapper(): ObjectMapper {
        val module = SimpleModule()
        module.addDeserializer(List::class.java, recipeListDeserializer)
        return ObjectMapper().registerModule(module)
    }
}
