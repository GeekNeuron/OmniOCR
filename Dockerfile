FROM python:3.10-slim

# Install OS dependencies for Tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-fas \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install .

# Expose port for API
EXPOSE 8000

# Run API by default
CMD ["uvicorn", "interface.api:app", "--host", "0.0.0.0", "--port", "8000"]
