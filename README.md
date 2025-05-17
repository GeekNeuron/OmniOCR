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
To enable optional OCR engine (`tesserocr`), run:
```bash
pip install -r requirements-optional.txt
```
> See [Optional Engine Installation Guide](docs/optional.md) for platform-specific help.




---

## Usage Examples

### Run OCR on an image:
```bash
omniocr ocr input.jpg --engine easyocr --lang fas+eng
```
### Batch OCR on PDF:
```bash
omniocr batch input.pdf --output-dir output/ --lang eng+deu
```
### Run OCR API:
```bash
uvicorn api:app --reload
```
### Launch Streamlit UI:
```bash
streamlit run ui_streamlit.py
```

---

## Documentation

- [Getting Started](docs/getting-started.md)

- [CLI Usage](docs/cli.md)

- [API Reference](docs/api.md)

- [FAQ](docs/faq.md)

- [Optional Engines Setup](docs/optional.md)



---

## Contributing

We welcome contributors! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

MIT © [GeekNeuron](https://github.com/GeekNeuron)
