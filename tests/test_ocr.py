import unittest
from PIL import Image
from core.ocr_engine import OCREngine
from core.postprocessor import correct_farsi_text

class TestOmniOCR(unittest.TestCase):
    def setUp(self):
        self.image = Image.new("RGB", (100, 50), color=(255, 255, 255))
        self.engine = OCREngine(engine_type="tesseract", lang="eng")

    def test_ocr_engine_type(self):
        self.assertIn(self.engine.engine_type, ["tesseract", "easyocr"])

    def test_postprocessor_replacements(self):
        raw = "يكي از كرم هاي الهی"
        cleaned = correct_farsi_text(raw)
        self.assertIn("یکی", cleaned)
        self.assertIn("کرم", cleaned)

    def test_empty_image_ocr(self):
        result = self.engine.recognize(self.image)
        self.assertIsInstance(result, str)

if __name__ == "__main__":
    unittest.main()
