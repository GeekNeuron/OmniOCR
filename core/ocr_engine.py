import pytesseract from PIL import Image from core.ai.lang_detect import detect_language from core.ai.post_correction import correct_with_bert

try: import easyocr has_easyocr = True except ImportError: has_easyocr = False

class OCREngine: def init(self, engine_type="tesseract", lang="auto"): self.engine_type = engine_type.lower() self.lang = lang if self.engine_type == "easyocr" and has_easyocr: self.reader = None  # Lazy load per call

def recognize(self, image: Image.Image) -> str:
    if self.engine_type == "tesseract":
        result = pytesseract.image_to_string(image)
    elif self.engine_type == "easyocr" and has_easyocr:
        if not self.reader:
            self.reader = easyocr.Reader(["fa", "en"], gpu=False)
        result = "\n".join(self.reader.readtext(image, detail=0))
    else:
        raise ValueError(f"Unsupported engine or missing dependency: {self.engine_type}")

    lang_detected = detect_language(result)
    if lang_detected == "fa":
        result = correct_with_bert(result)

    return result

