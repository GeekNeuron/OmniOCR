package org.omniocr

import platform.Foundation.*
import kotlinx.cinterop.*
import platform.darwin.*

@CName("runOcrIOS")
external fun runOcrIOS(imagePath: String, langCode: String): String

actual class OcrEngine {
    actual fun runOcr(imagePath: String, langCode: String): String {
        return runOcrIOS(imagePath, langCode)
    }
}
