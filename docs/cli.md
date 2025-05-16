# Command Line Interface (CLI)

OmniOCR includes a full-featured CLI powered by [Typer](https://typer.tiangolo.com).


---

## Basic Usage
```bash
omniocr ocr path/to/image.jpg --lang fas
```

---

## Subcommands

ocr

Run OCR on a file or folder.
```bash
omniocr ocr input.jpg --lang fas+eng --engine tesseract
```
## Options:

--`engine`: `tesseract` or `easyocr`

--`lang`: Language code(s) (`e.g`. `fas`, `eng`, `fas+eng`)

--`out`: Output file name (default: `ocr_output.txt`)

--`format`: Output format (txt/json/pdf)


## subtitle

OCR for subtitle files (.srt, .sub).
```bash
omniocr subtitle movie.srt --lang eng --out results.txt
```
## pdf

Run OCR on all pages of a PDF.
```bash
omniocr pdf document.pdf --lang fas --engine tesseract
```

---

## Batch OCR

Supports processing of folders:
```bash
omniocr ocr ./folder/ --lang fas --out results/
```

---

## Help
```bash
omniocr --help
```

---

### Next: [REST API](api.md)
