# OmniOCR – External Dependencies & Licenses

This document lists third-party libraries, models, and their licenses used in OmniOCR.

---

## OCR Engines

| Component   | License     | Notes                                 |
|-------------|-------------|---------------------------------------|
| Tesseract   | Apache 2.0  | https://github.com/tesseract-ocr     |
| EasyOCR     | Apache 2.0  | https://github.com/JaidedAI/EasyOCR  |

---

## AI Models

| Model                   | License     | Provider / Link                                        |
|------------------------|-------------|--------------------------------------------------------|
| ParsBERT               | Apache 2.0  | https://huggingface.co/HooshvareLab                   |
| TrOCR (Planned)        | MIT         | https://huggingface.co/microsoft/trocr-base-stage1    |

---

## Libraries (Python)

| Library         | License     | Note                    |
|----------------|-------------|-------------------------|
| pytesseract     | MIT         | Wrapper for Tesseract   |
| easyocr         | Apache 2.0  | PyTorch OCR library     |
| langdetect      | Apache 2.0  | Statistical detection   |
| transformers    | Apache 2.0  | HuggingFace             |
| torch           | BSD         | PyTorch framework       |
| fastapi         | MIT         | Web API framework       |
| streamlit       | Apache 2.0  | Web UI                  |
| typer           | MIT         | CLI manager             |
| PySide6         | LGPL        | Desktop UI framework    |

---

## Notes
- OmniOCR itself is licensed under **MIT**.
- Ensure to comply with LGPL for PySide6 in packaging.

Maintained by @GeekNeuron
