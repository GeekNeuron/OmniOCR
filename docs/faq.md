# Frequently Asked Questions (FAQ)

---

### ❓ What formats are supported?
- `.jpg`, `.png`, `.tif`
- `.pdf`
- `.srt`, `.sub`
- `.epub`

---

### ❓ Can I use OmniOCR offline?
Yes. OmniOCR is offline-first. Internet is required only for model downloads (optional).

---

### ❓ Which OCR engines are available?
- `tesseract`
- `easyocr`

---

### ❓ Which languages are supported?
Over 100+ via Tesseract, including:
- Farsi (fa), English (en), Arabic (ar), Turkish (tr), Chinese (zh), Japanese (ja)

---

### ❓ How do I run a batch OCR on folder?
```bash
omniocr ocr ./images/ --lang fas --engine easyocr
```

---

### ❓ How to export output to JSON or PDF?

Use the `--format` flag:
```bash
omniocr ocr input.jpg --format json
```

---

### Still have questions? [Open an issue](https://github.com/GeekNeuron/OmniOCR/issues).
