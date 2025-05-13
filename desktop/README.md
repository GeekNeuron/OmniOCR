# OmniOCR

**Offline, multilingual OCR Toolkit** for extracting text from images, PDFs, and videos (subtitles).

---

## Features

- Full **offline OCR** with [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- Supports **over 100 languages** (Arabic, Persian, Turkish, Chinese, Japanese, etc.)
- GUI (PySide6) for selecting files and exporting text
- Export to `.txt`, `.pdf`, `.docx`, `.epub`, `.mobi`, `.azw3`, `.srt`
- PDF OCR via `pdf2image`, video frame OCR via `OpenCV`
- CLI + Batch support for folders

---

## Installation

```bash
pip install -r requirements.txt
```

Make sure [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) is installed and added to your PATH.

Run the GUI

```bash
python ocr_gui.py
```

Export Formats
- `.docx` — Word file
- `.pdf` — Printable OCR PDF
- `.epub`, .mobi, .azw3 — eBooks (for Kindle or Apple Books)
- `.srt` — Subtitle file from OCR results

# License
MIT 2025 GeekNeuron
`Free and open source.`
