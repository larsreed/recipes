package net.kalars.recipes.model

import jakarta.persistence.*

@Entity
data class Recipe(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String,
    var subrecipe: Boolean = false, // New field
    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    var ingredients: MutableList<Ingredient> = mutableListOf(),
    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var attachments: MutableList<Attachment> = mutableListOf(),
    var people: Int,
    @Column(columnDefinition = "TEXT")
    var instructions: String,
    var served: String? = null,
    var sourceId: Long = 0,
    var pageRef: String? = null,
    var rating: Int? = null,
    var notes: String? = null
) {
    @ManyToOne @JoinColumn(name = "sourceId", insertable = false, updatable = false)
    var source: Source? = null

    constructor() : this(0, "", false, mutableListOf(), mutableListOf(), 0, "", null, 0L, null, null, null)
}
