package util

import android.graphics.Bitmap import android.graphics.BitmapFactory import android.util.Base64 import kotlinx.coroutines.Dispatchers import kotlinx.coroutines.withContext import java.net.HttpURLConnection import java.net.URL

actual object OcrHelper { actual suspend fun recognizeImagePlaceholder(): String = withContext(Dispatchers.IO) { // Placeholder HTTP call to local API (e.g., FastAPI) val apiUrl = "http://10.0.2.2:8000/ocr" // Emulator IP to localhost val imageBytes = ByteArray(0) // TODO: Capture/encode image from picker val payload = """{"image_base64": "${Base64.encodeToString(imageBytes, Base64.NO_WRAP)}"}"""

val conn = URL(apiUrl).openConnection() as HttpURLConnection
    conn.requestMethod = "POST"
    conn.setRequestProperty("Content-Type", "application/json")
    conn.doOutput = true
    conn.outputStream.write(payload.toByteArray())

    val response = conn.inputStream.bufferedReader().readText()
    response // return OCR text
}

}

