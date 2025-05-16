# REST API

### OmniOCR provides a simple REST API via [FastAPI](https://fastapi.tiangolo.com).

---

## Run the API
```bash
uvicorn OmniOCR/interface/api:app --reload
```
Then visit:
```
http://localhost:8000/docs
```

---

## Available Endpoints

POST /ocr/image

### OCR a base64-encoded image.
```Json
{
  "image": "<base64 string>",
  "lang": "fas+eng",
  "engine": "tesseract"
}
```
### Returns:
```Json
{
  "text": "...",
  "lang": "fa",
  "confidence": 0.92
}
```
POST /ocr/pdf

### OCR all pages of a base64-encoded PDF file.

POST /ocr/subtitle

### OCR a subtitle file uploaded as form-data.


---

## Swagger Docs

### Available at:
```
http://localhost:8000/docs
```
### OpenAPI schema:
```
http://localhost:8000/openapi.json
```

---

### Next: [FAQ](faq.md)
