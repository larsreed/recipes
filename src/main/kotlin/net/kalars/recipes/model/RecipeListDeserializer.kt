package net.kalars.recipes.model

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import net.kalars.recipes.repository.RecipeRepository
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Component

@Component
class RecipeListDeserializer @Autowired constructor(
    private val recipeRepository: RecipeRepository
) : JsonDeserializer<List<Recipe>>() {

    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): List<Recipe> {
        val node: JsonNode = p.codec.readTree(p)
        val res = node.map { it.asLong() }
            .mapNotNull { recipeRepository.findById(it).orElse(null) }
        return res
    }
}
