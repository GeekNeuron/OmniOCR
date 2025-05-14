package org.omniocr

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.net.toFile
import org.omniocr.ui.MainScreen
import java.io.File
import java.io.FileOutputStream

class MainActivity : ComponentActivity() {
    private lateinit var engine: OcrEngine

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        engine = OcrEngine()

        setContent {
            var imagePath by remember { mutableStateOf("") }
            val context = LocalContext.current

            val pickImageLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.GetContent()
            ) { uri: Uri? ->
                uri?.let {
                    val path = copyUriToInternalStorage(uri, context as Activity)
                    if (path != null) {
                        imagePath = path
                    } else {
                        Toast.makeText(context, "Unable to read file", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            MainScreen(
                engine = engine,
                imagePath = imagePath,
                onPickImage = { pickImageLauncher.launch("image/*") }
            )
        }
    }

    private fun copyUriToInternalStorage(uri: Uri, activity: Activity): String? {
        val inputStream = activity.contentResolver.openInputStream(uri) ?: return null
        val fileName = getFileName(uri, activity)
        val file = File(activity.cacheDir, fileName ?: "temp_image")
        FileOutputStream(file).use { outputStream ->
            inputStream.copyTo(outputStream)
        }
        return file.absolutePath
    }

    private fun getFileName(uri: Uri, activity: Activity): String? {
        var name: String? = null
        val cursor = activity.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            if (it.moveToFirst()) {
                val index = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index >= 0) name = it.getString(index)
            }
        }
        return name
    }
}
