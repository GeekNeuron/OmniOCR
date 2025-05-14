import pytesseract
from PIL import Image

try:
    import easyocr
    has_easyocr = True
except ImportError:
    has_easyocr = False

class OCREngine:
    def __init__(self, engine_type="tesseract", lang="fas+eng"):
        self.engine_type = engine_type.lower()
        self.lang = lang
        if self.engine_type == "easyocr" and has_easyocr:
            self.reader = easyocr.Reader([self.lang], gpu=False)

    def recognize(self, image: Image.Image) -> str:
        if self.engine_type == "tesseract":
            return pytesseract.image_to_string(image, lang=self.lang)
        elif self.engine_type == "easyocr" and has_easyocr:
            result = self.reader.readtext(image, detail=0)
            return "\n".join(result)
        else:
            raise ValueError(f"Unsupported engine or missing dependency: {self.engine_type}")
