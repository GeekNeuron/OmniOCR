import cv2
import os
from ocr_image import ocr_image_file


def extract_frames(video_path: str, output_folder: str, every_n_frames: int = 30):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    cap = cv2.VideoCapture(video_path)
    i = 0
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if i % every_n_frames == 0:
            filename = os.path.join(output_folder, f"frame_{frame_idx}.jpg")
            cv2.imwrite(filename, frame)
            frame_idx += 1
        i += 1

    cap.release()


def ocr_video_file(video_path: str, output_txt_path: str, languages: list, dpi: int = 300, crop_bottom: int = 0):
    frame_folder = "frames_temp"
    extract_frames(video_path, frame_folder)
    all_text = []

    for frame in sorted(os.listdir(frame_folder)):
        frame_path = os.path.join(frame_folder, frame)
        ocr_image_file(frame_path, "temp_out.txt", languages, dpi=dpi, crop_bottom=crop_bottom)
        with open("temp_out.txt", encoding="utf-8") as f:
            all_text.append(f.read())

    with open(output_txt_path, "w", encoding="utf-8") as out_file:
        out_file.write("\n".join(all_text))

    os.remove("temp_out.txt")
    for f in os.listdir(frame_folder):
        os.remove(os.path.join(frame_folder, f))
    os.rmdir(frame_folder)
