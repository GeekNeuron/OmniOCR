```markdown
# OmniOCR Architecture Overview

## Pipeline

1. Input (image, PDF, subtitle)


2. Preprocessing (CLAHE, deskew, binarization)


3. OCR engine (Tesseract or EasyOCR)


4. Postprocessing (error correction)


5. Output (JSON, TXT, PDF, EPUB, etc.)



## Modules
- `preprocessor.py`: contrast, rotation, denoise
- `ocr_engine.py`: integrates with multiple OCR backends
- `postprocessor.py`: handles common language errors
- `ocr_batch.py`: batch processing via multithreading
- `api.py`: REST API via FastAPI
- `ui_streamlit.py`: lightweight web interface

## Data Flow
```mermaid
flowchart LR
    A[Input] --> B[Preprocessing] --> C[OCR Engine] --> D[Postprocessing] --> E[Output]