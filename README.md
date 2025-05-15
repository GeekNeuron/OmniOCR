OmniOCR

OmniOCR is a modular, offline-first, AI-enhanced OCR toolkit with multilingual support. It supports image, subtitle, and document OCR across multiple platforms (Desktop, Web, Mobile).


---

🚀 Quickstart

1. CLI Usage

pip install .
omniocr ocr input.jpg --lang fa --output result.txt

2. Desktop App

python desktop/main_window.py

3. Web App

streamlit run interface/ui_streamlit.py

4. API

uvicorn interface.api:app --reload


---

🧩 Features

OCR via Tesseract or EasyOCR

AI-enhanced correction (ParsBERT)

Lang detection (langdetect)

Subtitle, PDF, image input

Material Design UI (Desktop, Compose Mobile)

Streamlit web UI

REST API via FastAPI



---

📦 Dependencies

Install full environment:

pip install -r requirements.txt

Or use pyproject.toml for isolated build.


---

🧪 Examples

# Persian OCR
omniocr ocr sample.png --lang fa

# English subtitle
omniocr ocr movie.sub --lang en --engine easyocr


---

📁 Folder Structure

OmniOCR/
├── core/          ← OCR logic + AI
├── interface/     ← FastAPI, Streamlit
├── desktop/       ← PySide6 GUI
├── mobile/        ← Compose Android/iOS
├── omniocr/       ← CLI runner
├── tests/         ← pytest


---

📚 Docs

ARCHITECTURE.md

ROADMAP.md

release-note.md



---

🧠 Future

TrOCR integration

Layout-aware OCR (Donut, LayoutLM)

Table and form extraction



---

📜 License

MIT © GeekNeuron

