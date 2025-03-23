package net.kalars.recipes.repository

import net.kalars.recipes.model.Recipe
import org.springframework.data.jpa.repository.JpaRepository

interface RecipeRepository : JpaRepository<Recipe, Long> {
    fun findbysourceId(sourceId: Long): List<Recipe>

}
