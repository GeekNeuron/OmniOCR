import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';

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

        let rawText = '';
        if (file.type === 'application/pdf') {
            rawText = await PDFHandler.process(file);
        } else if (file.type.startsWith('image/')) {
            rawText = await OCR.recognize(file);
        } else {
            throw new Error('Unsupported file format. Please use JPG, PNG, or PDF.');
        }

        // Apply post-processing for RTL languages
        let finalText = rawText;
        if (lang === 'fas' || lang === 'ara') {
            finalText = Postprocessor.normalizeRTL(rawText);
        }
        
        UI.displayResult(finalText);

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
