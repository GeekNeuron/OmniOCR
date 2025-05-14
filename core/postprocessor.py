import re

def correct_farsi_text(text: str) -> str:
    replacements = {
        "ي": "ی",
        "ك": "ک",
        "ۀ": "ه",
        "ﻻ": "لا",
        "ﺓ": "ة",
        "ـ": "",
        "ﺵ": "ش",
        "ﺖ": "ت",
        "ﺅ": "ؤ"
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    # Optional: fix spacing issues
    text = re.sub(r"\s+", " ", text)
    return text.strip()
