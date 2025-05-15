import pytest
import cv2
from core.ocr_engine import OCREngine
from core.preprocessor import preprocess_image

@pytest.mark.parametrize("engine_type", ["tesseract", "easyocr"])
def test_ocr_text_extraction(engine_type):
    engine = OCREngine(engine_type=engine_type, lang="eng")
    image = preprocess_image("tests/assets/sample_text_en.png")
    text = engine.recognize(image)
    assert isinstance(text, str)
    assert len(text.strip()) > 3  # Ensure output is non-trivial

def test_invalid_engine():
    with pytest.raises(ValueError):
        OCREngine(engine_type="unknown")
