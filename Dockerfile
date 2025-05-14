FROM python:3.10-slim

RUN apt-get update && apt-get install -y \\
    tesseract-ocr \\
    tesseract-ocr-fas \\
    libglib2.0-0 libsm6 libxext6 libxrender-dev \\
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

RUN pip install --upgrade pip \\
    && pip install -r requirements_api.txt

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
