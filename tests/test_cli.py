import subprocess
import sys
from pathlib import Path

TEST_IMAGE = "tests/assets/sample_text_en.png"
OUTPUT_FILE = "tests/output/test_cli_result.txt"


def test_cli_ocr_text():
    cmd = [
        sys.executable, "-m", "omniocr", "ocr", TEST_IMAGE,
        "--lang", "eng", "--output", OUTPUT_FILE
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    assert result.returncode == 0
    assert Path(OUTPUT_FILE).exists()
    with open(OUTPUT_FILE, encoding="utf-8") as f:
        content = f.read()
    assert len(content.strip()) > 3


def test_cli_invalid_path():
    cmd = [
        sys.executable, "-m", "omniocr", "ocr", "invalid.png"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    assert result.returncode != 0
    assert "Error" in result.stderr or "No such file" in result.stderr
