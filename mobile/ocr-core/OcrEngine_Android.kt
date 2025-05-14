package org.omniocr

actual class OcrEngine {
    init {
        System.loadLibrary("OCRBridge")
    }

    external fun runOcrNative(imagePath: String, langCode: String): String

    actual fun runOcr(imagePath: String, langCode: String): String {
        return runOcrNative(imagePath, langCode)
    }
}
