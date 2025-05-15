# OmniOCR – Models & Engines

This document clarifies the OCR and AI models used in OmniOCR, their sources, and licensing.

---

## OCR Engines

### 1. Tesseract OCR
- **Source**: https://github.com/tesseract-ocr/tesseract
- **Version**: 5.3+
- **Languages**: 100+ (incl. fa, ar, en, zh, ja)
- **License**: Apache 2.0

### 2. EasyOCR
- **Source**: https://github.com/JaidedAI/EasyOCR
- **Framework**: PyTorch
- **Languages**: 80+
- **License**: Apache 2.0

### 3. Planned: TrOCR (Microsoft)
- **Model**: microsoft/trocr-base-stage1
- **HuggingFace**: https://huggingface.co/microsoft/trocr-base-stage1
- **License**: MIT
- **Usage**: Optical character transformer for better Arabic/Farsi accuracy

---

## AI Correction

### 1. ParsBERT
- **Source**: https://huggingface.co/HooshvareLab/bert-base-parsbert-uncased
- **Type**: Transformer language model for Persian
- **Purpose**: Post-OCR error correction
- **License**: Apache 2.0

### 2. Langdetect
- **Purpose**: Language auto-detection
- **Notes**: Statistical, non-ML; supports 55+ langs

---

## Future Model Integration

| Task               | Model Suggestion               | Source                                 |
|--------------------|--------------------------------|----------------------------------------|
| Layout OCR         | LayoutLMv3, Donut              | HuggingFace / NAVER / Microsoft        |
| Table Extraction   | CascadeTabNet, PaddleOCR       | GitHub                                 |
| OCR QA Correction  | BERT QA, FiD, T5 QA            | HuggingFace                            |
| Post-OCR Summarize | BART, Pegasus, T5-small        | Google, Facebook AI                    |

---

This document is updated as models evolve.  
Maintained by @GeekNeuron
