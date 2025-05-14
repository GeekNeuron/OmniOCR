from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from preprocessor import preprocess_image
from ocr_engine import OCREngine
from postprocessor import correct_farsi_text
from PIL import Image
import tempfile

app = FastAPI(title="OmniOCR API")

@app.post("/ocr/image")
async def ocr_image(
    file: UploadFile = File(...),
    engine: str = Form("tesseract"),
    lang: str = Form("fas")
):
    try:
        suffix = ".png" if file.content_type == "image/png" else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(await file.read())
            temp.flush()
            image = preprocess_image(temp.name)

        ocr_engine = OCREngine(engine_type=engine, lang=lang)
        raw_text = ocr_engine.recognize(image)
        clean_text = correct_farsi_text(raw_text)

        return {"engine": engine, "lang": lang, "text": clean_text}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/")
def root():
    return {"message": "OmniOCR API is running"}
