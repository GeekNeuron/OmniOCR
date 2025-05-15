import pytest from fastapi.testclient import TestClient from interface.api import app from pathlib import Path

client = TestClient(app)

@pytest.fixture def sample_image_bytes(): path = Path("tests/assets/sample_text_en.png") return path.read_bytes()

def test_ocr_api_success(sample_image_bytes): response = client.post("/ocr", files={"file": ("test.png", sample_image_bytes, "image/png")}) assert response.status_code == 200 data = response.json() assert "text" in data assert isinstance(data["text"], str) assert len(data["text"].strip()) > 3

def test_ocr_api_invalid(): response = client.post("/ocr", files={"file": ("bad.txt", b"not image", "text/plain")}) assert response.status_code == 400 or response.status_code == 422

