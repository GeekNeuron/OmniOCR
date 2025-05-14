import re

# قواعد اصلاح OCR فارسی
COMMON_REPLACEMENTS = {
    "ي": "ی",  # عربی به فارسی
    "ك": "ک",
    "ﻻ": "لا",
    "ۀ": "ه",
    "ؤ": "و",
    "إ": "ا",
    "أ": "ا"
}

# اصلاحات مبتنی بر الگو
REGEX_PATTERNS = {
    r"(\w)ه(\s)": r"\1ه‌\2",  # نیم‌فاصله بعد از ه
    r"اللّه": "الله"
}

def correct_farsi_text(text: str) -> str:
    # جایگزینی‌های ساده
    for wrong, correct in COMMON_REPLACEMENTS.items():
        text = text.replace(wrong, correct)

    # اصلاحات با الگوهای regex
    for pattern, replacement in REGEX_PATTERNS.items():
        text = re.sub(pattern, replacement, text)

    return text

# تست دستی
if __name__ == "__main__":
    sample = "اللّه يكي از اسماء كرم است."
    print(correct_farsi_text(sample))

