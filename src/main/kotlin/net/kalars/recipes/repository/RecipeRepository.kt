package net.kalars.recipes.repository

import net.kalars.recipes.model.Recipe
import org.springframework.data.jpa.repository.JpaRepository

interface RecipeRepository : JpaRepository<Recipe, Long> {
    fun findBySourceId(sourceId: Long): List<Recipe>
    fun findBySubrecipeFalse(): List<Recipe>
    fun findBySubrecipesId(subrecipeId: Long): List<Recipe>
}
