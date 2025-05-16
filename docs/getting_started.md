# Getting Started

Welcome to **OmniOCR**! This guide helps you set up and run your first OCR job quickly.

---

## 1. Requirements

- Python 3.8+
- pip
- Optional: Tesseract OCR engine

Install dependencies:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Install Tesseract (if using it):
```bash
# Ubuntu

sudo apt install tesseract-ocr tesseract-ocr-fas

# macOS (Homebrew)
brew install tesseract
```

---

## 2. Running OmniOCR

### CLI:
```bash
omniocr ocr path/to/image.jpg --lang fas+eng
```
### Web UI:
```bash
streamlit run OmniOCR/interface/web_ui.py
```
### REST API:
```bash
uvicorn OmniOCR/interface/api:app --reload
```

---

## 3. Sample OCR

### Run OCR on an image:
```bash
omniocr ocr samples/scan.jpg --lang fas --engine tesseract
```
### OCR from a subtitle:
```bash
omniocr subtitle samples/sample.srt --lang eng
```

---

### Continue to [CLI Usage](cli.md) or [API](api.md).

