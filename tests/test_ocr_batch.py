import pytest
from core.ocr_engine import OCREngine
from core.utils.pdf_utils import pdf_to_images
from core.utils.subtitle_parser import extract_frames_from_subtitle
import os

PDF_PATH = "tests/samples/sample.pdf"
SUB_PATH = "tests/samples/sample.srt"

@pytest.mark.skipif(not os.path.exists(PDF_PATH), reason="Sample PDF not found")
def test_pdf_ocr_pipeline():
    engine = OCREngine("tesseract", lang="eng")
    images = pdf_to_images(PDF_PATH)
    for image in images:
        result = engine.recognize(image)
        assert isinstance(result, str)

@pytest.mark.skipif(not os.path.exists(SUB_PATH), reason="Sample subtitle not found")
def test_subtitle_ocr_pipeline():
    engine = OCREngine("tesseract", lang="eng")
    frames = extract_frames_from_subtitle(SUB_PATH)
    for img, ts in frames[:2]:
        result = engine.recognize(img)
        assert isinstance(result, str)
