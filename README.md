# OmniOCR

OmniOCR is a professional-grade, offline-first OCR toolkit designed for image, PDF, and subtitle extraction. Featuring multilingual recognition and AI-powered text correction, it offers developers and users multiple interfaces including CLI, API, and Web UI.

![OmniOCR Banner](https://raw.githubusercontent.com/GeekNeuron/OmniOCR/main/assets/omniocr-banner.png)

## Key Features
- **Multilingual OCR**: Supports Farsi, English, Arabic, Japanese, Chinese, Turkish and more
- **AI Correction**: Transformer-based error correction using BERT
- **OCR Engines**: EasyOCR & Tesseract (pluggable)
- **Input Formats**: PNG, JPG, PDF, SRT, SUB
- **Cross-platform Interfaces**:
  - Terminal CLI (Typer)
  - Web App (Streamlit)
  - RESTful API (FastAPI)
- **Downloadable Results**: Auto-generate `.txt` files
- **Fully Offline**: Works without internet

## Installation
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```
# Tesseract install for Linux
```
sudo apt install tesseract-ocr tesseract-ocr-fas
```
## Quick Usage

CLI:
```
omniocr ocr path/to/image.jpg --lang fas+eng
```
Web UI:
```
streamlit run OmniOCR/interface/web_ui.py
```
REST API:
```
uvicorn OmniOCR/interface/api:app --reload
```
Docker
```
docker-compose up --build
```
## Development

- Python 3.8+

- Torch, Transformers, EasyOCR, OpenCV

- Modular directory structure with core/, interface/, ui/, tests/


## Roadmap Highlights

- [ ] Real-time subtitle OCR (live video)

- [ ] Handwritten Farsi OCR

- [ ] Mobile & Compose Multiplatform deployment


## License

MIT © GeekNeuron

## Contributors

Pull requests welcome – contribute to the dev branch!
