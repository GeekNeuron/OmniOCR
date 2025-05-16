import pytest
from core.ocr_engine import OCREngine
from PIL import Image

@pytest.fixture
def sample_image():
    # Creates a blank white image for OCR testing
    return Image.new("RGB", (300, 100), color=(255, 255, 255))

@pytest.fixture
def dummy_engine():
    return OCREngine(engine_type="tesseract", lang="eng")

def test_ocr_on_blank_image(dummy_engine, sample_image):
    text = dummy_engine.recognize(sample_image)
    assert text.strip() == ""

def test_engine_init():
    engine = OCREngine(engine_type="tesseract", lang="eng+fas")
    assert engine.lang == "eng+fas"
    assert engine.engine_type == "tesseract"
