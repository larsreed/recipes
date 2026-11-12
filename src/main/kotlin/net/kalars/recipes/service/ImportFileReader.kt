package net.kalars.recipes.service

import org.apache.poi.ss.usermodel.DataFormatter
import org.apache.poi.ss.usermodel.WorkbookFactory
import java.io.ByteArrayInputStream
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets

/** Turns an uploaded file (text in various encodings, or an Excel workbook) into tab-separated import text. */
object ImportFileReader {

    val importMarkers = setOf("Source", "Recipe", "Ingredient", "Subrecipe", "Attachment", "Conversion", "Temperature")

    fun readContent(fileBytes: ByteArray): String {
        val decodedText = decodeText(fileBytes)
        val excelText = runCatching { excelToTabSeparated(fileBytes) }.getOrNull()

        return when {
            excelText != null && containsImportMarker(excelText) -> excelText
            containsImportMarker(decodedText) -> decodedText
            excelText != null -> excelText
            else -> decodedText
        }
    }

    private fun excelToTabSeparated(fileBytes: ByteArray): String {
        val dataFormatter = DataFormatter()
        return WorkbookFactory.create(ByteArrayInputStream(fileBytes)).use { workbook ->
            buildString {
                for (sheet in workbook) {
                    for (rowIndex in 0..sheet.lastRowNum) {
                        val row = sheet.getRow(rowIndex)
                        val lastCell = row?.lastCellNum?.toInt() ?: 0
                        if (lastCell <= 0) {
                            append("\n")
                            continue
                        }
                        val columns = (0..<lastCell).map { colIndex ->
                            dataFormatter.formatCellValue(row.getCell(colIndex)).trimEnd()
                        }
                        append(columns.joinToString("\t").trimEnd())
                        append("\n")
                    }
                }
            }
        }
    }

    private fun decodeText(fileBytes: ByteArray): String {
        val charset: Charset = when {
            fileBytes.size >= 2 && fileBytes[0] == 0xFF.toByte() && fileBytes[1] == 0xFE.toByte() -> Charsets.UTF_16LE
            fileBytes.size >= 2 && fileBytes[0] == 0xFE.toByte() && fileBytes[1] == 0xFF.toByte() -> Charsets.UTF_16BE
            else -> StandardCharsets.UTF_8
        }
        return String(fileBytes, charset).replace("\u0000", "")
    }

    private fun containsImportMarker(content: String): Boolean =
        content.lineSequence().any { rawLine ->
            val firstToken = rawLine.trim()
                .removePrefix("#")
                .trimStart()
                .split("\t", " ")
                .firstOrNull()
                ?.trim('"')
                ?: ""
            firstToken in importMarkers
        }
}
