import pytest
from core.ocr_engine import OCREngine
from PIL import Image

@pytest.fixture
def sample_image():
    return Image.new("RGB", (300, 100), color=(255, 255, 255))

@pytest.fixture
def tesseract_engine():
    return OCREngine(engine_type="tesseract", lang="eng")

@pytest.fixture
def easyocr_engine():
    return OCREngine(engine_type="easyocr", lang="en")

def test_ocr_on_blank_image_tesseract(tesseract_engine, sample_image):
    text = tesseract_engine.recognize(sample_image)
    assert text.strip() == ""

def test_ocr_on_blank_image_easyocr(easyocr_engine, sample_image):
    text = easyocr_engine.recognize(sample_image)
    assert text.strip() == ""

def test_engine_init():
    engine = OCREngine(engine_type="tesseract", lang="eng+fas")
    assert engine.lang == "eng+fas"
    assert engine.engine_type == "tesseract"
