package org.omniocr.ui

import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.Button
import androidx.compose.material.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.input.TextFieldValue
import org.omniocr.OcrEngine

@Composable
fun MainScreen(
    engine: OcrEngine,
    imagePath: String = "",
    onPickImage: () -> Unit = {},
    onShare: (String) -> Unit = {}
) {
    var langCode by remember { mutableStateOf("eng") }
    var ocrResult by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.Top)
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onPickImage) { Text("Select Image") }
            Text(imagePath.takeLast(30))
        }

        Text("Enter Lang Code (e.g. eng, fas):")
        BasicTextField(
            value = TextFieldValue(langCode),
            onValueChange = { langCode = it.text },
            modifier = Modifier.fillMaxWidth()
        )

        Button(onClick = {
            ocrResult = engine.runOcr(imagePath, langCode)
        }) {
            Text("Run OCR")
        }

        Button(onClick = { onShare(ocrResult) }, enabled = ocrResult.isNotEmpty()) {
            Text("Share Result")
        }

        Text("Result:")
        Text(ocrResult)
    }
}