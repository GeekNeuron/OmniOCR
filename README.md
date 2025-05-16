# OmniOCR



> **OmniOCR** is a modular, offline-first Optical Character Recognition engine supporting image, PDF, and subtitle (SRT/SUB) inputs with multilingual and AI-enhanced text correction. Built with Python and designed for cross-platform use.




---

## Features

**Multilingual OCR** — Farsi, English, Arabic, Turkish, Chinese, Japanese, etc.

**OCR Engines** — Tesseract + EasyOCR (pluggable)

**AI Postprocessing** — BERT-based correction, auto language detection

**Formats Supported** — `.png`, `.jpg`, `.pdf`, `.srt`, `.sub`, `.epub`

**Interfaces:**

CLI via [Typer](https://typer.tiangolo.com)

Web UI via [Streamlit](https://streamlit.io)

REST API via [FastAPI](https://fastapi.tiangolo.com)


**Offline-first** — Runs without internet after setup

**Cross-platform** — Windows, Linux, macOS, Android (WIP), iOS (WIP)

**Export Options** — Text output, batch mode, format conversion



---

## Installation

# Install dependencies
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```
# Install OCR engines
```bash
sudo apt install tesseract-ocr tesseract-ocr-fas  # Linux
```
## CLI Usage
```bash
omniocr ocr path/to/image.jpg --lang fas+eng
```
## Web UI
```bash
streamlit run OmniOCR/interface/web_ui.py
```
## REST API
```bash
uvicorn OmniOCR/interface/api:app --reload
```
## Docker (optional)
```bash
docker-compose up --build
```

---

## Architecture

```mermaid
flowchart LR
    Input[Input File (Image / PDF / Subtitle)] --> Pre[Preprocessing]
    Pre --> OCR[OCR Engine (Tesseract/EasyOCR)]
    OCR --> AI[AI Correction (BERT)]
    AI --> Out[Output (TXT / JSON / Export)]
```
## Project Structure
```
OmniOCR/
├── core/           # OCR engines, pre/post processors, lang detection
├── interface/      # CLI, Web API, Streamlit UI
├── ui/             # Material theme & components
├── data/           # Sample assets, fonts, models
├── tools/          # Helpers: subtitle parser, epub export
├── tests/          # Pytest test coverage
├── .github/        # CI/CD, templates, security
```
## Test & Coverage
```bash
pytest tests/
coverage run -m pytest && coverage report
```
## Contribution & Community

[Contributing Guide](CONTRIBUTING.md)

[Issue Templates](.github/ISSUE_TEMPLATE/)

[Security Policy](SECURITY.md)

Discussions: [GitHub Discussions](https://github.com/GeekNeuron/OmniOCR/discussions)


---

## Roadmap Highlights

- [x] Subtitle & PDF OCR

- [x] Web UI with Material theme

- [x] AI postprocessing

- [ ] Handwritten Farsi OCR

- [ ] Real-time OCR stream

- [ ] Mobile multiplatform UI (Compose)


---

## License

MIT © [GeekNeuron](https://github.com/GeekNeuron)

