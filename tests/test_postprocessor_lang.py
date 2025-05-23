import pytest
from core.ai.lang_detect import detect_language
from core.ai.post_correction import correct_with_bert

@pytest.mark.parametrize("text, expected_lang", [
    ("سلام دنیا", "fa"),
    ("Hello world", "en"),
    ("こんにちは世界", "ja"),
    ("", None),
    ("!!!", None),
])
def test_language_detection(text, expected_lang):
    lang = detect_language(text)
    assert lang == expected_lang

def test_post_correction_typical():
    original = "اين يك متن اشتباه است"
    corrected = correct_with_bert(original)
    assert isinstance(corrected, str)
    assert len(corrected) > 0

def test_post_correction_empty():
    corrected = correct_with_bert("")
    assert corrected == ""

def test_post_correction_noise():
    noisy = "ھذذذذ ھھھھھھ!!؟؟؟؟؟؟"
    corrected = correct_with_bert(noisy)
    assert isinstance(corrected, str)
