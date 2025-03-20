package net.kalars.recipes.model

import jakarta.persistence.*

@Entity
data class Attachment(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val fileName: String,
    @Lob
    val fileContent: String
) {
    constructor() : this(0, "", "")
}
