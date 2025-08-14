package net.kalars.recipes.model

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import jakarta.persistence.*

@Entity
data class Recipe(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String,
    var people: Int,
    @Column(columnDefinition = "TEXT")
    var instructions: String? = null,
    var closing: String? = null,
    var served: String? = null,
    var pageRef: String? = null,
    var rating: Int? = null,
    var notes: String? = null,
    var subrecipe: Boolean = false,
    var wineTips: String? = null,
    var matchFor: String? = null,
    var categories: String? = null,

    @ManyToMany
    @JoinTable(
        name = "recipe_subrecipe",
        joinColumns = [JoinColumn(name = "recipe_id")],
        inverseJoinColumns = [JoinColumn(name = "subrecipe_id")]
    )
    @JsonDeserialize(using = RecipeListDeserializer::class)
    @OrderColumn(name = "subrecipe_order")
    var subrecipes: MutableList<Recipe> = mutableListOf(),

    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    @OrderBy("sortorder ASC") // Ensures ingredients are ordered by sortorder
    var ingredients: MutableList<Ingredient> = mutableListOf(),

    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var attachments: MutableList<Attachment> = mutableListOf(),

    var sourceId: Long? = null,
) {
    @ManyToOne @JoinColumn(name = "sourceId", insertable = false, updatable = false)
    var source: Source? = null

    constructor() : this(0, "", 0, null, null, null, null, null,
        null, false, null, null, null, mutableListOf(), mutableListOf(), mutableListOf(), null)
}
