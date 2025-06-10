import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';

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
            UI.updateProgress('Recognizing text in image...', 0);
            resultText = await OCR.recognize(file);
        } else {
            throw new Error('Unsupported file format. Please use JPG, PNG, or PDF.');
        }
        
        UI.displayResult(resultText);

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message || 'An unknown error occurred during processing.');
    } finally {
        // Terminate worker to free up memory
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

// Start the application once the DOM is ready
document.addEventListener('DOMContentLoaded', init);
