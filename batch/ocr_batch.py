import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from core.ocr_engine import OCREngine
from core.preprocessor import preprocess_image
from core.postprocessor import correct_farsi_text


def ocr_single_file(file_path: str, output_path: str, engine_name: str, lang: str):
    try:
        image = preprocess_image(file_path)
        engine = OCREngine(engine_type=engine_name, lang=lang)
        raw_text = engine.recognize(image)
        clean_text = correct_farsi_text(raw_text)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(clean_text)
    except Exception as e:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"ERROR: {e}")


def batch_ocr(folder_path: str, output_dir: str, engine_name: str = "tesseract", lang: str = "fas"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    files = [f for f in os.listdir(folder_path) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    tasks = []

    with ThreadPoolExecutor() as executor:
        for file_name in files:
            input_path = os.path.join(folder_path, file_name)
            base_name, _ = os.path.splitext(file_name)
            output_path = os.path.join(output_dir, base_name + ".txt")
            tasks.append(executor.submit(ocr_single_file, input_path, output_path, engine_name, lang))

        for future in as_completed(tasks):
            future.result()
