# === [interface/ui_streamlit.py] (Material-style CSS injection) ===

import streamlit as st
from PIL import Image
from core.ocr_engine import OCREngine

MATERIAL_CSS = """
<style>
body {
    font-family: 'Roboto', sans-serif;
    background-color: #f5f5f5;
    color: #212121;
}
button[kind="primary"] {
    background-color: #6200EE !important;
    color: white;
    border-radius: 6px;
    padding: 0.6em 1.2em;
}
</style>
"""

st.set_page_config(page_title="OmniOCR", layout="centered")
st.markdown(MATERIAL_CSS, unsafe_allow_html=True)
st.title("OmniOCR Streamlit")

image_file = st.file_uploader("Upload an Image", type=["png", "jpg", "jpeg"])

if image_file:
    image = Image.open(image_file)
    st.image(image, caption="Uploaded Image", use_column_width=True)
    engine = OCREngine()
    result = engine.recognize(image)
    st.text_area("OCR Result", value=result, height=300)
