package net.kalars.recipes.model

import jakarta.persistence.*
import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonProperty
import java.util.Base64

@Entity
data class Attachment(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var fileName: String,
    var fileType: String,
    @Lob
    @JsonIgnore
    var data: ByteArray? = null
) {
    constructor() : this(0, "", "", null)

    @JsonProperty("data")
    fun getDataAsBase64(): String? {
        return data?.let { Base64.getEncoder().encodeToString(it) }
    }

    @JsonProperty("data")
    fun setDataFromBase64(data: String) {
        val base64Data = data.substringAfter("base64,")
        this.data = Base64.getDecoder().decode(base64Data)
    }
}
