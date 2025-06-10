import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';

// No need for SUBHandler anymore

async function handleFile(file) {
    if (!file) return;

    UI.reset();
    const lang = UI.langSelect.value;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    // Check for subtitle files first
    if (fileExtension === 'sub' || fileExtension === 'idx') {
        UI.showSubtitleGuide(true);
        // Reset file input to allow re-selection of the same file later
        UI.fileInput.value = ''; 
        return; // Stop processing here
    }
    
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

        const finalText = Postprocessor.cleanup(rawText, lang);
        UI.displayResult(finalText);

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message || 'An unknown error occurred during processing.');
    } finally {
        OCR.terminate();
        // Reset file input after processing is done
        UI.fileInput.value = '';
    }
}

function init() {
    UI.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    UI.setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
