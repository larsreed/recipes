package net.kalars.recipes.model

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id

@Entity
data class Conversion(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var factor: Float,
    var fromMeasure: String,
    var toMeasure: String,
    var description: String? = ""
) {
    constructor() : this(0, 0.0f, fromMeasure = "", toMeasure = "", description = "")
}
