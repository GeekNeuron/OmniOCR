# OmniOCR (Web Version)

<p align="center">
  <img src="/assets/images/favicon-512x512.png" alt="OmniOCR Logo" width="120">
</p>

<p align="center">
  <strong>A modern, offline-first OCR engine that runs entirely in your browser, with an optional, powerful cloud-based advanced mode.</strong>
  <br />
  Built with Tesseract.js and designed for performance, privacy, and ease of use.
</p>

<p align="center">
  <img alt="GitHub stars" src="https://img.shields.io/github/stars/GeekNeuron/OmniOCR?style=for-the-badge&color=blueviolet">
  <img alt="GitHub license" src="https://img.shields.io/github/license/GeekNeuron/OmniOCR?style=for-the-badge&color=blue">
  <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge">
</p>

<p align="center">
  <a href="https://geekneuron.github.io/OmniOCR/"><strong>View Live Demo</strong></a>
</p>

---

<p align="center">
  <img src="/assets/images/Screenshot.png" alt="OmniOCR Application Screenshot" style="border-radius: 8px; max-width: 100%; width: 700px;">
</p>

## ✨ Features

-   **Dual-Mode OCR**:
    -   **Local Mode**: Uses Tesseract.js for fast, private, and fully offline processing directly in your browser.
    -   **Advanced Mode**: Connects to powerful cloud APIs (Google Vision, Cloudinary, Hugging Face) for maximum accuracy on complex images.
-   **Multi-Format Support**: Seamlessly extract text from **Images** (`JPG`, `PNG`), multi-page **PDFs**, and image-based subtitles (`.sub`/`.idx`).
-   **Multilingual Engine**: Powered by Tesseract.js, supporting over 60 languages with a searchable dropdown menu.
-   **High Accuracy**: Includes advanced **image preprocessing** (upscaling, thresholding) and **text post-processing** to significantly improve accuracy, especially for RTL languages.
-   **Optimized Performance**: Features an intelligent **caching system** for the OCR engine, providing near-instant processing for consecutive tasks in the same language.
-   **Modern UI/UX**: A clean, minimalist interface with a theme switcher (light & galaxy-dark), smooth animations, and smart file handling.
-   **Smart Download**: A dynamic download button provides a `.txt` file for images/PDFs and a fully formatted `.srt` file for subtitles.
-   **Zero Installation & Offline First**: No setup required. The application can run entirely offline after the first visit.

---

## 🛠️ Technology Stack

OmniOCR leverages powerful, browser-native and cloud technologies:

-   **Local OCR Engine**: [Tesseract.js](https://github.com/naptha/tesseract.js)
-   **Cloud OCR Engine**: [Google Cloud Vision AI](https://cloud.google.com/vision)
-   **PDF Rendering**: [PDF.js](https://mozilla.github.io/pdf.js/)
-   **Subtitle Parsing**: [vobsub.js](https://github.com/vobsub/vobsub.js)
-   **Styling**: Pure CSS with a modern, themeable design.
-   **Core Logic**: Vanilla JavaScript (ES6+ Modules)

---

## 🚀 Usage

Using OmniOCR is simple:

1.  **Open the Web App**: Navigate to the [live demo page](https://geekneuron.github.io/OmniOCR/).
2.  **Choose Your Mode**:
    -   Keep **Advanced Mode** off for fast, offline processing.
    -   Toggle it on and provide your API keys for the highest possible accuracy.
3.  **Select a Language**: Use the searchable dropdown (in local mode) to select the language of your document. Your choice will be saved for future visits.
4.  **Upload a File**:
    -   For **images or PDFs**, drop a single file or click to select.
    -   For **subtitles**, drop or select both the `.sub` and `.idx` files together.
5.  **Get Results**: The app will automatically process the file and display the extracted text in a code-like editor. You can then copy the result or download it in the appropriate format.

To switch between light and dark themes, simply click on the **OmniOCR** title at the top of the page.

---

## 🤝 Contributing

Contributions are welcome! Whether you're fixing a bug, improving the UI, or adding a new feature, your help is appreciated. Please read the [**Contributing Guidelines**](CONTRIBUTING.md) to get started.

---

## 📄 License

This project is open-source and is licensed under the [**MIT License**](LICENSE).

---

> Created by **[@GeekNeuron](https://github.com/GeekNeuron)**
