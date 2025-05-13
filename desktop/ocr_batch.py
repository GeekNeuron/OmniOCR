import os
from ocr_image import ocr_image_file
from ocr_pdf import ocr_pdf_file
from ocr_video import ocr_video_file


def batch_ocr(folder_path: str, output_dir: str, languages: list):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for file_name in os.listdir(folder_path):
        full_path = os.path.join(folder_path, file_name)
        base_name, ext = os.path.splitext(file_name)
        ext = ext.lower()

        output_path = os.path.join(output_dir, base_name + ".txt")

        try:
            if ext in [".jpg", ".jpeg", ".png"]:
                ocr_image_file(full_path, output_path, languages)
            elif ext == ".pdf":
                ocr_pdf_file(full_path, output_path, languages)
            elif ext in [".mp4", ".avi", ".mov"]:
                ocr_video_file(full_path, output_path, languages)
            else:
                print(f"Skipped unsupported file: {file_name}")
        except Exception as e:
            print(f"Error processing {file_name}: {e}")
