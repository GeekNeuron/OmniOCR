import streamlit as st
from core.ocr_engine import OCREngine
from core.preprocessor import preprocess_image
from core.ai.lang_detect import detect_language
from core.ai.post_correction import correct_with_bert
from PIL import Image
import tempfile

st.set_page_config(page_title="OmniOCR Web", layout="centered")
st.title("OmniOCR – Web Interface")

uploaded_file = st.file_uploader("Upload an image, PDF or subtitle:", type=["png", "jpg", "jpeg", "pdf", "srt", "sub"])
engine_type = st.selectbox("Select OCR engine:", ["tesseract", "easyocr"])
lang_code = st.text_input("OCR language code (e.g., eng, fas, jpn):", value="eng")

if uploaded_file:
    file_bytes = uploaded_file.read()
    suffix = uploaded_file.name.split(".")[-1].lower()

    if suffix in ["png", "jpg", "jpeg"]:
        with tempfile.NamedTemporaryFile(delete=False, suffix="." + suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        image = preprocess_image(tmp_path)
        st.image(Image.open(tmp_path), caption="Uploaded Image", use_column_width=True)

        st.subheader("Detected Text")
        engine = OCREngine(engine_type=engine_type, lang=lang_code)
        result = engine.recognize(image)
        st.code(result)

        if st.checkbox("Auto-correct with AI"):
            st.subheader("Corrected Text")
            corrected = correct_with_bert(result)
            st.code(corrected)

        st.markdown(f"**Language:** `{detect_language(result)}`")
    else:
        st.warning("Non-image OCR formats coming soon.")
