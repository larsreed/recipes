package net.kalars.recipes.model

import jakarta.persistence.*


@Entity
data class Source (
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val name: String,
    val authors: String,
    @OneToMany(cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    @JoinColumn(name = "attachment_id")
    var attachments: List<Attachment> = mutableListOf()
) {
    constructor() : this(0, "", "", mutableListOf())
}
