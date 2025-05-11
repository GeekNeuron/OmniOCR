# OCR Toolkit (Offline, Multilingual)

**Multilingual OCR desktop software** for extracting and editing text from **images**, **PDFs**, and **videos** (subtitles), with full offline support and high accuracy via Tesseract OCR engine.

## Features

* **Image OCR**: Single image or batch mode.
* **PDF OCR**: Extract text from scanned PDFs.
* **Video Subtitle OCR**: Extract hardcoded subtitles from videos to `.txt` or `.srt`.
* **Language Auto-Detect**: Detect language of content automatically.
* **Multi-language support**: Arabic, Persian, Chinese, Turkish, Japanese, and more.
* **Export Formats**: `.txt`, `.docx`, `.pdf`, `.srt`
* **Batch OCR**: Process folders of images, PDFs, or videos.
* **Customizable OCR Settings**: DPI, image cropping, etc.

## Screenshots

*(Add screenshots or a screen recording here)*

---

## Installation

### 1. Install Tesseract OCR

* Download and install [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
* Add its path to system environment.
* Install desired language models in `tessdata` directory.

Example on Windows:

```bash
choco install tesseract
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the app

```bash
python ocr_gui.py
```

---

## Build Windows Executable

```bash
pyinstaller build_ocr_app.spec
```

---

## Folder Structure

```
ocr-toolkit/
├── ocr_gui.py          # Main GUI entry point
├── ocr_image.py        # Image OCR
├── ocr_pdf.py          # PDF OCR
├── ocr_video.py        # Video subtitle OCR
├── ocr_batch.py        # Batch processing
├── ocr_export.py       # DOCX / PDF exporting
├── lang_detect.py      # Language auto-detection
├── build_ocr_app.spec  # PyInstaller config
├── requirements.txt
└── README.md
```

---

## License

MIT License 2025 GeekNeuron
