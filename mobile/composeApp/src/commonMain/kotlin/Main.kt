package main

import androidx.compose.ui.window.ComposeUIViewController import androidx.compose.ui.window.Window import androidx.compose.ui.window.application import ui.screens.MainScreen import ui.theme.OmniTheme

@Composable fun App() { OmniTheme { MainScreen() } }

fun main() = application { Window(onCloseRequest = ::exitApplication, title = "OmniOCR") { App() } }

// iOS Entry (for Compose Multiplatform iOS embedding) fun MainViewController() = ComposeUIViewController { App() }

