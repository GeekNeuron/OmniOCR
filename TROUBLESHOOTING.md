```markdown
# OmniOCR — Troubleshooting Guide

## tesseract: command not found
> Tesseract is not installed or not in PATH
```bash
sudo apt install tesseract-ocr

Language data not found: fas

> Persian language pack missing



sudo apt install tesseract-ocr-fas

ModuleNotFoundError: No module named easyocr

> Install missing dependencies



pip install -r requirements_api.txt

PySide6 GUI error (Linux)

> Missing system libraries



sudo apt install libxcb-xinerama0

ffmpeg not found (required for sub/idx processing)

sudo apt install ffmpeg