package util

import kotlinx.coroutines.Dispatchers import kotlinx.coroutines.withContext

object OcrHelper { suspend fun recognizeImagePlaceholder(): String = withContext(Dispatchers.Default) { // TODO: Implement actual OCR bridge (expect/actual or HTTP call) // Here we return mock text for now "متن شناسایی شده از تصویر (OCR placeholder)" } }

