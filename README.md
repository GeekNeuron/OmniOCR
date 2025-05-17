# OmniOCR

> OmniOCR is a modular, offline-first OCR engine designed to extract text from images, PDFs, subtitles, and documents—supporting multilingual pipelines including Persian, Chinese, Japanese, Arabic, and more.

![OmniOCR Logo](https://raw.githubusercontent.com/GeekNeuron/OmniOCR/main/docs/assets/logo.png)

---

## Features

- **Multi-engine support**: EasyOCR, Tesseract, optional tesserocr
- **Multi-language OCR**: Over 100 languages including Farsi, Chinese, Japanese
- **File formats**: image (PNG, JPG), PDF, subtitle (SRT, VTT), EPUB
- **Interfaces**: CLI, FastAPI, Web UI (Streamlit)
- **Post-processing**: Rule-based correction + transformer-based AI
- **Batch processing** for folders or multi-page files
- **Offline-first**, optionally enhanced with online models

---

## Installation

Install base dependencies:

```bash
pip install -r requirements.txt
```
To enable optional OCR engine (tesserocr), run:

pip install -r requirements-optional.txt

> See Optional Engine Installation Guide for platform-specific help.




---

Usage Examples

Run OCR on an image:

omniocr ocr input.jpg --engine easyocr --lang fas+eng

Batch OCR on PDF:

omniocr batch input.pdf --output-dir output/ --lang eng+deu

Run OCR API:

uvicorn api:app --reload

Launch Streamlit UI:

streamlit run ui_streamlit.py


---

Documentation

Getting Started

CLI Usage

API Reference

FAQ

Optional Engines Setup



---

Contributing

We welcome contributors! Please read CONTRIBUTING.md before submitting a pull request.

License

MIT © GeekNeuron
