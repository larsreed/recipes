package net.kalars.recipes.model

import jakarta.persistence.*


@Entity
data class Source (
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val name: String,
    val authors: String,
    @Column(columnDefinition = "TEXT")
    val info: String?,
    @Column(columnDefinition = "TEXT")
    val title: String?
) {
    constructor() : this(0, "", "", null, null)
}
