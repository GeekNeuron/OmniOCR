import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { SUBHandler } from './subHandler.js'; // Import the new handler

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
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (file.type === 'application/pdf') {
            rawText = await PDFHandler.process(file);
        } else if (file.type.startsWith('image/')) {
            rawText = await OCR.recognize(file);
        } else if (fileExtension === 'sub') {
            rawText = await SUBHandler.process(file);
        } else {
            throw new Error('Unsupported file format. Please use JPG, PNG, PDF, or SUB.');
        }

        // Apply universal post-processing for all languages
        const finalText = Postprocessor.cleanup(rawText, lang);
        
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
