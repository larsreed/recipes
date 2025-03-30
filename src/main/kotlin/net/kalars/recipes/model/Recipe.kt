package net.kalars.recipes.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import jakarta.persistence.*

@Entity
data class Recipe(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String,
    var people: Int,
    @Column(columnDefinition = "TEXT")
    var instructions: String,
    var served: String? = null,
    var pageRef: String? = null,
    var rating: Int? = null,
    var notes: String? = null,
    var subrecipe: Boolean = false,
    var wineTips: String? = null,

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
    var ingredients: MutableList<Ingredient> = mutableListOf(),

    @OneToMany(cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    var attachments: MutableList<Attachment> = mutableListOf(),

    var sourceId: Long = 0,
) {
    @ManyToOne @JoinColumn(name = "sourceId", insertable = false, updatable = false)
    var source: Source? = null

    constructor() : this(0, "", 0, "", null, null, null,
        null, false, null, mutableListOf(), mutableListOf(), mutableListOf(), 0)
}
