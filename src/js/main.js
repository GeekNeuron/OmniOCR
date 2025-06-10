import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import './preprocessor.js'; // Ensure the preprocessor module is included

/**
 * Main application logic to handle file processing.
 * @param {File} file - The file to be processed.
 */
async function handleFile(file) {
    if (!file) return;

    UI.reset();
    const lang = UI.langSelect.value;
    
    try {
        await OCR.initialize(lang);

        let resultText = '';
        if (file.type === 'application/pdf') {
            resultText = await PDFHandler.process(file);
        } else if (file.type.startsWith('image/')) {
            resultText = await OCR.recognize(file);
        } else {
            throw new Error('Unsupported file format. Please use JPG, PNG, or PDF.');
        }
        
        UI.displayResult(resultText);

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message || 'An unknown error occurred during processing.');
    } finally {
        OCR.terminate();
    }
}

/**
 * Initializes the application and sets up event listeners.
 */
function init() {
    UI.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    UI.setupEventListeners();
    console.log("OmniOCR Web App Initialized.");
}

document.addEventListener('DOMContentLoaded', init);
