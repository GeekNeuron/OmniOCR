from langdetect import detect, DetectorFactory DetectorFactory.seed = 0

def detect_language(text: str) -> str: try: lang = detect(text) return lang except Exception: return "unknown"

Example:

detect_language("سلام دنیا") -> 'fa'

