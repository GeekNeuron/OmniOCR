from pdf2image import convert_from_path
from ocr_image import ocr_image_file
import os


def ocr_pdf_file(pdf_path: str, output_txt_path: str, languages: list, dpi: int = 300):
    images = convert_from_path(pdf_path, dpi=dpi)
    full_text = ""

    for i, img in enumerate(images):
        temp_img = f"page_{i}.png"
        img.save(temp_img)
        ocr_image_file(temp_img, "temp_out.txt", languages, dpi=dpi)
        with open("temp_out.txt", encoding="utf-8") as f:
            full_text += f.read() + "\n"

        os.remove(temp_img)

    with open(output_txt_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    os.remove("temp_out.txt")
