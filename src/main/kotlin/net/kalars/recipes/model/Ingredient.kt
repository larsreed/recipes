package net.kalars.recipes.model

import jakarta.persistence.*

@Entity
data class Ingredient(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var amount: Float? = null,
    var measure: String? = null,
    @Column(nullable = false)
    var name: String,
    var instruction: String? = null
) {
    constructor() : this(0, null, null,"", null)
}
