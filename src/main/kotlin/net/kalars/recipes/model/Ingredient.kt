package net.kalars.recipes.model

import jakarta.persistence.*

@Entity
data class Ingredient(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    @Column(columnDefinition = "TEXT")
    var preamble: String? = null,
    var amount: Float? = null,
    var measure: String? = null,
    @Column(columnDefinition = "TEXT")
    var prefix: String? = null,
    @Column(nullable = false)
    var name: String,
    @Column(columnDefinition = "TEXT")
    var instruction: String? = null,
    var sortorder: Int = 0
) {
    constructor() : this(0, null,null, null,null, "",null, 0)
}
