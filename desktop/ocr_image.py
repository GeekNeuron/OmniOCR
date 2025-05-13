from PIL import Image, ImageFilter
import pytesseract
import cv2
import os


def ocr_image_file(image_path: str, output_txt_path: str, languages: list, dpi: int = 300, crop_bottom: int = 0):
    lang = "+".join(languages)

    image = Image.open(image_path)
    if crop_bottom > 0:
        width, height = image.size
        image = image.crop((0, 0, width, height - crop_bottom))

    image = image.convert("L")
    image = image.filter(ImageFilter.MedianFilter())
    threshold = 150
    image = image.point(lambda p: 255 if p > threshold else 0)

    image.save("processed_image.png", dpi=(dpi, dpi))

    text = pytesseract.image_to_string(Image.open("processed_image.png"), lang=lang)
    with open(output_txt_path, "w", encoding="utf-8") as f:
        f.write(text)

    os.remove("processed_image.png")
