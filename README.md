# OmniOCR

**OmniOCR** is a powerful, offline-first, AI-augmented OCR toolkit with multilingual support, real-time processing, and a modular architecture.

---

## ✅ Features

- **Offline OCR** with Tesseract and EasyOCR  
- **AI-powered post-processing** using ParsBERT  
- **Auto language detection** (langdetect)  
- **FastAPI + Streamlit interfaces**  
- **Material 3 UI for Desktop and Mobile (Compose)**  
- **Desktop GUI with PySide6 (Material-style QSS)**  
- **Mobile UI via Compose Multiplatform (Android/iOS)**  
- **PDF, subtitle, and image input support**

---

## 📦 Structure Overview

OmniOCR/ ├── core/ │   ├── ocr_engine.py │   ├── preprocessor.py │   ├── postprocessor.py │   └── ai/ │       ├── lang_detect.py │       └── post_correction.py ├── desktop/ │   ├── main_window.py │   └── styles/material.qss ├── mobile/composeApp/ │   ├── Main.kt │   ├── ui/screens/MainScreen.kt │   ├── ui/theme/Theme.kt │   └── util/OcrHelper.kt ├── interface/ │   ├── api.py │   └── ui_streamlit.py ├── tests/ │   └── test_ocr.py ├── README.md, ROADMAP.md, ARCHITECTURE.md

---

## 🚀 Run Desktop App

```bash
python desktop/main_window.py
```

🌐 Run API

uvicorn interface.api:app --reload

📊 Run Streamlit UI

```streamli
run interface/ui_streamlit.py
```

---

🧠 AI-Enhanced Roadmap

OCR correction with BERT (✓)

Realtime OCR + Queue (⧗)

TrOCR/Donut integration (⬜)

Table extraction, layout-aware parsing (⬜)


See ROADMAP.md for full plan.
