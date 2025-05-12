package net.kalars.recipes.model

import jakarta.persistence.*

@Entity
data class Ingredient(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var prefix: String? = null,
    var amount: Float? = null,
    var measure: String? = null,
    @Column(nullable = false)
    var name: String,
    var instruction: String? = null,
    var sortorder: Int = 0
) {
    constructor() : this(0, null,null, null,"", null, 0)
}
