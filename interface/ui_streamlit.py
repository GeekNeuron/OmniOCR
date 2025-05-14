import streamlit as st
import requests
from PIL import Image
import io

API_URL = "http://localhost:8000/ocr/image"

st.set_page_config(page_title="OmniOCR Web UI", layout="centered")
st.title("OmniOCR - Web OCR")

uploaded_file = st.file_uploader("Upload image for OCR", type=["png", "jpg", "jpeg"])
engine = st.selectbox("OCR Engine", ["tesseract", "easyocr"])
lang = st.text_input("Language code (e.g., fas, eng, ara)", value="fas")

if uploaded_file and st.button("Run OCR"):
    files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
    data = {"engine": engine, "lang": lang}
    try:
        with st.spinner("Processing..."):
            res = requests.post(API_URL, files=files, data=data)
        if res.status_code == 200:
            st.success("Extracted Text:")
            st.text_area("Result", res.json()["text"], height=300)
        else:
            st.error(f"Error {res.status_code}:\n{res.text}")
    except Exception as e:
        st.error(f"API connection error: {e}")
