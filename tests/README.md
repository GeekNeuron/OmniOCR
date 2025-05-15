# OmniOCR – Test Suite

This directory contains automated tests for OCR engines, CLI, API, and AI modules.

---

## 🧪 Test Coverage

| File                 | Module Tested       | Description                          |
|----------------------|---------------------|--------------------------------------|
| test_core_ocr.py     | core.ocr_engine     | OCR output from image                |
| test_cli.py          | omniocr CLI         | End-to-end OCR via CLI               |
| test_api.py          | FastAPI interface   | API /ocr endpoint                    |
|                      | AI/lang_detect      | Persian language detection           |
|                      | AI/post_correction  | Grammar fix with ParsBERT            |

---

## ▶️ Run All Tests

Run with `pytest` from the root:
```bash
pytest -v

Or test one file:

pytest tests/test_cli.py


---

## 📁 Requirements

Install all testing dependencies:

pip install -r requirements.txt

You must have OCR engines (Tesseract/EasyOCR) installed and working locally.


---

Maintained by @GeekNeuron
