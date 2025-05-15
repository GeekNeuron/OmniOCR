import streamlit as st
from core.ocr_engine import OCREngine
from core.preprocessor import preprocess_image
from core.ai.lang_detect import detect_language
from core.ai.post_correction import correct_with_bert
from core.utils.pdf_utils import pdf_to_images
from core.utils.subtitle_parser import extract_frames_from_subtitle
from PIL import Image
import tempfile
import base64

st.set_page_config(page_title="OmniOCR Web", layout="centered")
st.title("OmniOCR – Web Interface")

uploaded_file = st.file_uploader("Upload an image, PDF or subtitle:", type=["png", "jpg", "jpeg", "pdf", "srt", "sub"])
engine_type = st.selectbox("Select OCR engine:", ["tesseract", "easyocr"])
lang_code = st.text_input("OCR language code (e.g., eng, fas, jpn):", value="eng")

ocr_engine = OCREngine(engine_type=engine_type, lang=lang_code)
results = []

if uploaded_file:
    file_bytes = uploaded_file.read()
    suffix = uploaded_file.name.split(".")[-1].lower()

    def render_and_ocr(image):
        st.image(image, caption="Input Frame", use_column_width=True)
        st.subheader("Detected Text")
        result = ocr_engine.recognize(image)
        st.code(result)
        results.append(result)
        if st.checkbox("Auto-correct with AI", key=f"correct_{hash(result)}"):
            st.subheader("Corrected Text")
            corrected = correct_with_bert(result)
            st.code(corrected)
            results[-1] = corrected
        st.markdown(f"**Language:** `{detect_language(result)}`")

    if suffix in ["png", "jpg", "jpeg"]:
        with tempfile.NamedTemporaryFile(delete=False, suffix="." + suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        image = preprocess_image(tmp_path)
        render_and_ocr(image)

    elif suffix == "pdf":
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        images = pdf_to_images(tmp_path)
        for idx, image in enumerate(images):
            st.markdown(f"### Page {idx + 1}")
            render_and_ocr(image)

    elif suffix in ["srt", "sub"]:
        with tempfile.NamedTemporaryFile(delete=False, suffix="." + suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        frames = extract_frames_from_subtitle(tmp_path)
        for i, (image, ts) in enumerate(frames[:3]):
            st.markdown(f"### Subtitle Frame {i+1} ({ts})")
            render_and_ocr(image)

    else:
        st.warning("Unsupported format.")

    if results:
        full_text = "\n\n".join(results)
        b64 = base64.b64encode(full_text.encode()).decode()
        href = f'<a href="data:file/txt;base64,{b64}" download="omniocr_output.txt">Download Output as TXT</a>'
        st.markdown("---")
        st.markdown(href, unsafe_allow_html=True)
