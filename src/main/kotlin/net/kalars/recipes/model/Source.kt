package net.kalars.recipes.model

import jakarta.persistence.*


@Entity
data class Source (
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val name: String,
    val authors: String,
) {
    constructor() : this(0, "", "")
}
