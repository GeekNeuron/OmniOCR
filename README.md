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
```
OmniOCR/
├── core/
│   ├── ocr_engine.py
│   ├── preprocessor.py
│   ├── postprocessor.py
│   └── ai/
│       ├── lang_detect.py
│       └── post_correction.py
├── desktop/
│   ├── main_window.py
│   └── styles/material.qss
├── mobile/composeApp/
│   ├── Main.kt
│   ├── ui/screens/MainScreen.kt
│   ├── ui/theme/Theme.kt
│   └── util/OcrHelper.kt
├── interface/
│   ├── api.py
│   └── ui_streamlit.py
├── omniocr/
│   ├── cli.py
│   └── __main__.py
├── tests/
│   └── test_ocr.py
├── README.md, ROADMAP.md, ARCHITECTURE.md
```

---

## 🚀 Run Desktop App
```bash
python desktop/main_window.py
```

## 🌐 Run API
```bash
uvicorn interface.api:app --reload
```

## 📊 Run Streamlit UI
```bash
streamlit run interface/ui_streamlit.py
```

## 🔁 CLI OCR
```bash
omniocr ocr input.jpg --lang fa --output result.txt
```

---

## 🤖 AI Enhancements

| Feature         | Engine/Model                     |
|----------------|----------------------------------|
| Language detect| langdetect                       |
| Correction     | HooshvareLab/parsbert-uncased    |
| Future         | TrOCR, LayoutLM, Donut, Pegasus  |

---

## 🌍 Supported Languages
- ✅ Persian (فارسی), English, Arabic, Turkish  
- 🧪 Chinese, Japanese (EasyOCR only)  
- Configurable via `--lang` or auto-detected

---

## 📦 Build & Distribute

### Local Install
```bash
pip install .
```

### Package
```bash
python -m build
```

### Run from source
```bash
python -m omniocr ocr input.png
```

---

## 🧱 Architecture

```mermaid
flowchart TD
    A[Image/PDF/Input] --> B[Preprocessing]
    B --> C[OCR Engine]
    C --> D[Lang Detect]
    D --> E[AI Correction (BERT)]
    E --> F[Output: CLI/API/GUI]
```

More in [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 🗺️ Roadmap Highlights

- [x] Modular OCR engine  
- [x] Desktop, Mobile, Web UIs  
- [x] Language-aware correction  
- [ ] Real-time OCR queue (Celery, ONNX GPU)  
- [ ] Layout-aware models (Donut/LayoutLM)  
- [ ] Table detection + CSV export  
- [ ] Subtitle/EPUB OCR enhancements  

See [`ROADMAP.md`](./ROADMAP.md) for full plan.

---

## 🔓 License

MIT © [GeekNeuron](https://github.com/GeekNeuron)
