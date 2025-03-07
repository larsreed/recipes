package net.kalars.recipes.model

import jakarta.persistence.*


@Entity
data class Recipe(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var name: String,
    @OneToMany(cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    var ingredients: List<Ingredient> = mutableListOf(),
    var people: Int,
    @Column(columnDefinition = "TEXT")
    var instructions: String,
    var served: String? = null,
    @OneToMany(cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    var attachments: List<Attachment> = mutableListOf(),
    @Transient
    val sourceId: Long = 0
) {
    @ManyToOne @JoinColumn(name = "source_id")
    var source: Source? = null

    constructor() : this(0, "", mutableListOf(), 0, "", null, mutableListOf(), 0)
}
