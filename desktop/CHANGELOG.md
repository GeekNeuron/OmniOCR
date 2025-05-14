# Changelog

All notable changes to **OmniOCR** will be documented in this file.

---

## [v1.0.0-mobile] - 2025-05-13
### Added
- Android & iOS support via Kotlin Compose Multiplatform
- Native Tesseract OCR via JNI (Android) and Swift interop (iOS)
- Shared UI with Compose (image picker, OCR run, share result)

### Notes
- iOS requires manual linking of `libtesseract.a`
- Android supports API 26+ and 64-bit ABIs

---

## [v1.0.0-desktop] - 2025-05-10
### Added
- Full offline OCR support for Image, PDF, and Video
- Multilingual OCR with auto language detection
- GUI with PySide6
- Export to TXT, DOCX, PDF, EPUB, MOBI, AZW3, and SRT

### Batch Features
- Folder processing with live logs
- Tesseract preprocessing controls (DPI, crop)

---

*This project is maintained by GeekNeuron — Open Source OCR for everyone.*
