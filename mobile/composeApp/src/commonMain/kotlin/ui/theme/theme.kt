package ui.theme

import androidx.compose.material3.* import androidx.compose.runtime.Composable import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme( primary = Color(0xFF6200EE), secondary = Color(0xFF03DAC5), background = Color(0xFFF5F5F5), surface = Color.White, onPrimary = Color.White, onSecondary = Color.Black, onBackground = Color.Black, onSurface = Color.Black, )

private val DarkColors = darkColorScheme( primary = Color(0xFFBB86FC), secondary = Color(0xFF03DAC5), background = Color(0xFF121212), surface = Color(0xFF1E1E1E), onPrimary = Color.Black, onSecondary = Color.Black, onBackground = Color.White, onSurface = Color.White, )

@Composable fun OmniTheme( darkTheme: Boolean = false, content: @Composable () -> Unit ) { val colors = if (darkTheme) DarkColors else LightColors MaterialTheme( colorScheme = colors, typography = Typography(), content = content ) }

