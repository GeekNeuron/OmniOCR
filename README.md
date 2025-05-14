# OmniOCR

**Offline, multilingual OCR toolkit** for processing images, PDFs, and videos — with full support for Persian, Arabic, Chinese, Japanese, and more.

## Features

- Offline OCR with support for 100+ languages
- Input formats: Image (PNG, JPG), PDF, subtitle video (sub/idx/mp4)
- Output formats: `.txt`, `.pdf`, `.epub`, `.docx`, `.srt`, `.mobi`, `.azw3`
- OCR engines:
  - Tesseract (default)
  - EasyOCR (optional)
- Advanced preprocessing: deskew, contrast enhancement, CLAHE, adaptive threshold
- Interfaces:
  - Desktop GUI (PySide6)
  - REST API (FastAPI)
  - Web UI (Streamlit)
  - Mobile (Compose Multiplatform)

## Quick Start

```bash
uvicorn api:app --reload
```

Run Tests

python -m unittest test_ocr.py

## License

MIT — developed by @GeekNeuron