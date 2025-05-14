from transformers import AutoTokenizer, AutoModelForMaskedLM import torch

tokenizer = AutoTokenizer.from_pretrained("HooshvareLab/bert-base-parsbert-uncased") model = AutoModelForMaskedLM.from_pretrained("HooshvareLab/bert-base-parsbert-uncased") model.eval()

def correct_with_bert(text: str, mask_token="[MASK]") -> str: inputs = tokenizer(text, return_tensors="pt") with torch.no_grad(): outputs = model(**inputs) predictions = torch.argmax(outputs.logits, dim=-1) corrected = tokenizer.decode(predictions[0], skip_special_tokens=True) return corrected

