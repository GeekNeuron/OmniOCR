=== [docs/ARCHITECTURE.md] ===

OmniOCR – System Architecture

Overview

OmniOCR is built on a modular, extensible pipeline with multiple OCR engines, AI-based correction, and multi-platform UI delivery.


---

🔧 Pipeline Flow

flowchart TD
    A[Input: Image/PDF/Subtitle] --> B[Preprocessor]
    B --> C[OCR Engine]
    C --> D[Language Detector]
    D --> E[AI Postprocessor (ParsBERT)]
    E --> F[Output Formatter]
    F --> G[CLI/API/GUI]


---

🧱 Module Breakdown

core/

ocr_engine.py: Wraps Tesseract, EasyOCR

preprocessor.py: Noise reduction, thresholding

postprocessor.py: Rule-based text fix

ai/

lang_detect.py: Fast langdetect wrapper

post_correction.py: Transformer-based fixer



interface/

api.py: FastAPI endpoints

ui_streamlit.py: Streamlit + Material CSS


desktop/

PySide6 + QSS theming (Material)


mobile/composeApp/

Compose Multiplatform Android/iOS/Desktop

Uses shared Kotlin logic with Material 3


omniocr/

CLI using Typer

Entrypoint: __main__.py



---

📡 Supported Inputs/Outputs

Input	Output

PNG, JPG	TXT, JSON
PDF	TXT, PDF
SUB/IDX	SRT, TXT
EPUB	TXT



---

🧩 Extensibility

Add OCR engines easily in ocr_engine.py

Add postprocessing layers in post_correction.py

Add new input types via core/parser

REST + WebSocket ready



---

🗺️ Architecture Benefits

Clean separation of concerns

Asynchronous-ready backend

UI-agnostic processing engine



---

Maintained by @GeekNeuron

