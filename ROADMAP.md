# OmniOCR Development Roadmap

> Last updated: 2025

---

## ✅ Completed
- Modular structure with core/batch/interface
- Desktop UI with PySide6
- API interface with FastAPI
- Streamlit interface
- Language detection (langdetect)
- Post-correction with ParsBERT
- Material Design QSS for desktop

---

## 🧠 AI-Powered Features (in progress)
- [x] ParsBERT-based correction (core/ai/post_correction.py)
- [x] Language detection (core/ai/lang_detect.py)
- [ ] Add TrOCR or LayoutLMv3 integration (huggingface)
- [ ] Auto summarization (DistilBART/Pegasus-light)
- [ ] Table structure extraction (Donut/LayoutLMv3)

---

## 🎨 UI Enhancements
- [x] Material Design QSS for PySide6
- [ ] Material 3 UI for Compose Multiplatform (mobile)
- [ ] Material style in Streamlit via CSS injection

---

## ☁️ Online & Realtime Processing
- [ ] Async FastAPI support
- [ ] OCR task queue (Celery + Redis)
- [ ] ONNX Runtime / TensorRT GPU speed-up
- [ ] Real-time webcam OCR

---

## 🔬 Testing & Evaluation
- [ ] CER/WER scoring tools
- [ ] Benchmarking on Persian datasets (OCR + handwriting)
- [ ] Multi-engine A/B test framework

---

## 📦 Packaging & Deployment
- [x] Dockerized
- [ ] PyPI installable CLI + core
- [ ] Electron-based desktop release (optional)
- [ ] GitHub Actions CI + auto test

---

## 🌍 Language & I18n
- [x] Persian + English
- [ ] Arabic, Kurdish, Japanese
- [ ] Auto lang-switch via langdetect

---

## 🧩 Optional Plugins
- [ ] Subtitle OCR (sub/idx)
- [ ] Table to CSV extractor
- [ ] Custom model loader system
