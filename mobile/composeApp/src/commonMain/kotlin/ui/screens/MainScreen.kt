package ui.screens

import androidx.compose.foundation.layout.* import androidx.compose.material3.* import androidx.compose.runtime.* import androidx.compose.ui.Alignment import androidx.compose.ui.Modifier import androidx.compose.ui.text.style.TextAlign import androidx.compose.ui.unit.dp import androidx.compose.ui.unit.sp import kotlinx.coroutines.launch import util.OcrHelper

@Composable fun MainScreen() { var result by remember { mutableStateOf("") } val scope = rememberCoroutineScope()

Surface(
    modifier = Modifier.fillMaxSize(),
    color = MaterialTheme.colorScheme.background
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "OmniOCR",
            fontSize = 24.sp,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.Center
        )

        Button(onClick = {
            scope.launch {
                result = OcrHelper.recognizeImagePlaceholder()
            }
        }) {
            Text("Pick Image")
        }

        if (result.isNotEmpty()) {
            Text(text = result, fontSize = 16.sp)
        }
    }
}

}

