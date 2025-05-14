package org.omniocr

expect class OcrEngine {
    fun runOcr(imagePath: String, langCode: String): String
}
