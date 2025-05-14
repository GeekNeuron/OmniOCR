OmniOCR - بخش 5 / فایل 1

README_mobile.md

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

mobile/ ├── build.gradle.kts         # Root multiplatform setup ├── ui/                      # Compose UI code ├── ocr-core/                # Native OCR interface (expect/actual) │   ├── C++ JNI (Android) │   └── Swift bridge (iOS) ├── androidApp/              # Android entry point └── iosApp/                  # iOS AppDelegate + Swift glue

---

## Requirements
- Android: SDK 26+
- iOS: iOS 13+, Apple Silicon preferred
- Tesseract lib built for each platform

---

## License
MIT License — part of OmniOCR ecosystem by [GeekNeuron](https://github.com/GeekNeuron).