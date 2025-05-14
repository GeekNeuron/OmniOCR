# OmniOCR Mobile (Android & iOS)

OmniOCR Mobile is the cross-platform mobile version of the offline multilingual OCR toolkit, built using **Kotlin Compose Multiplatform** and native **Tesseract OCR** bindings.

## Features

- Offline OCR on images
- Multilingual: English, Persian, Turkish, Japanese, Chinese, etc.
- Native Tesseract integration (JNI / Swift interop)
- Clean Compose UI (shared Android & iOS)
- Image picker + result sharing

---

## Build Instructions

### Android:
- Open in Android Studio
- Build & run `:androidApp`

### iOS:
- Use Xcode 14+
- Run `./gradlew iosX64Binaries` or open generated `.xcworkspace`
- Link libtesseract.a and Swift `runOcrIOS()` implementation

---

## Project Structure
