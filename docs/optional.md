# Optional: Enable Tesserocr Backend

`tesserocr` offers better performance in some cases, but it requires extra system setup.

---

## 1. Why Use `tesserocr`?
- Fast and efficient wrapper for Tesseract
- Direct C++ integration
- Better accuracy in certain use-cases (e.g. high-quality scans)

---

## 2. System Requirements
- Tesseract-OCR installed (v5.x recommended)
- C++ compiler and build tools

### Windows Setup
- Download Tesseract from [UB Mannheim Builds](https://github.com/UB-Mannheim/tesseract/wiki)
- Add Tesseract to system PATH (e.g. `C:\Program Files\Tesseract-OCR`)
- Install **Visual C++ Build Tools** from [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### macOS/Linux Setup
```bash
# Ubuntu/Debian
sudo apt install tesseract-ocr libtesseract-dev

# macOS (Homebrew)
brew install tesseract
```

---

## 3. Install tesserocr (after system setup)
```bash
pip install tesserocr
```
Or via the optional requirements:
```bash
pip install -r requirements-optional.txt
```

---

## 4. Use it in OmniOCR

In the CLI:
```bash
omniocr ocr input.png --engine tesserocr
```

---

If installation fails, fallback to `easyocr` or `pytesseract`. For more help, open an issue on [GitHub](https://github.com/GeekNeuron/OmniOCR/issues).
