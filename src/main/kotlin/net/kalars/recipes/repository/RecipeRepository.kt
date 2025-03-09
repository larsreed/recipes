package net.kalars.recipes.repository

import net.kalars.recipes.model.Recipe
import org.springframework.data.jpa.repository.JpaRepository

interface RecipeRepository : JpaRepository<Recipe, Long> {
    fun findBySource_Id(sourceId: Long): List<Recipe>
}
