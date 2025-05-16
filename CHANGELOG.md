# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-05-13

### Added
- Initial release of OmniOCR
- OCR support for Images, PDFs, and Subtitles (SRT, SUB)
- Multilingual engine: Tesseract + EasyOCR
- Language detection and BERT-powered post-correction
- Web UI (Streamlit), CLI (Typer), API (FastAPI)
- Downloadable `.txt` outputs
- Offline-first support
- Cross-platform compatibility (Windows, macOS, Linux, Android)
- GitHub Actions for CI/CD, PyPI, Docker
- Security, Contribution, Issue, PR templates

### Fixed
- Subtitle preprocessing (format/timing issues)
- PDF to image conversion stability

### Changed
- Modular code structure (core, interface, ui, tools, tests)
- Optimized OCR processing pipeline

---

Past and future versions will appear here.
