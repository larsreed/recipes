package net.kalars.recipes.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id

@Entity
data class Temperature(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var temp: Float,
    var meat: String
) {
    constructor() : this(0, 0.0f, "")
}
