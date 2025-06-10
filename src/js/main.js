import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';

const fileCache = { idx: null, sub: null };
let ocrEngineCache = { worker: null, lang: null };

/**
 * Gets the OCR engine, either from cache or by initializing a new one.
 * This improves performance for sequential operations with the same language.
 * @param {string} lang - The language code for the desired OCR engine.
 * @returns {Promise<Tesseract.Worker>} The initialized Tesseract worker.
 */
async function getOcrEngine(lang) {
    // If a worker exists and is for the correct language, return the cached one.
    if (ocrEngineCache.worker && ocrEngineCache.lang === lang) {
        console.log("Using cached OCR engine.");
        return ocrEngineCache.worker;
    }
    
    // If a worker exists but for a different language, terminate it first.
    console.log("Initializing new OCR engine...");
    if (ocrEngineCache.worker) {
        await ocrEngineCache.worker.terminate();
    }
    
    // Create and cache the new worker.
    const worker = await OCR.initialize(lang);
    ocrEngineCache = { worker, lang };
    return worker;
}

/**
 * Main file handling logic. Routes files to the correct processor.
 */
async function handleFiles(files) {
    if (!files || files.length === 0) return;

    UI.reset();

    // --- Smart Subtitle Handling Logic ---
    let hasSub = false, hasIdx = false;
    for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension === 'sub') {
            fileCache.sub = file;
            hasSub = true;
        }
        if (extension === 'idx') {
            fileCache.idx = file;
            hasIdx = true;
        }
    }

    if (hasSub || hasIdx) {
        if (fileCache.idx && fileCache.sub) {
            UI.showSubtitlePrompt("For best results, please use a dedicated tool like Subtitle Edit for .sub/.idx files.");
            setTimeout(() => {
                UI.reset();
                fileCache.idx = null;
                fileCache.sub = null;
            }, 4000);
        } else if (fileCache.idx) {
            UI.showSubtitlePrompt("IDX file received. Please add the corresponding SUB file.");
        } else if (fileCache.sub) {
            UI.showSubtitlePrompt("SUB file received. Please add the corresponding IDX file.");
        }
        // Do not terminate the worker here, so the user can continue with other files.
        UI.fileInput.value = '';
        return; 
    }

    // --- Standard File Processing for Single Files ---
    if (files.length === 1) {
        const file = files[0];
        const lang = UI.getSelectedLanguage();
        try {
            // Use the caching function to get the worker
            const worker = await getOcrEngine(lang);
            let rawText = '';

            if (file.type === 'application/pdf') {
                rawText = await PDFHandler.process(file, worker);
            } else if (file.type.startsWith('image/')) {
                rawText = await OCR.recognize(file, worker);
            } else {
                throw new Error('Unsupported file format. Please use JPG, PNG, or PDF.');
            }

            const finalText = Postprocessor.cleanup(rawText, lang);
            UI.displayResult(finalText);

        } catch (error) {
            console.error('Processing Error:', error);
            UI.displayError(error.message || 'An unknown error occurred.');
        } finally {
            UI.fileInput.value = ''; // Allow re-uploading the same file
        }
    } else if (files.length > 1) {
        UI.displayError("Please upload only one file at a time (or a matching .sub/.idx pair).");
    }
}


function init() {
    UI.populateLanguageOptions();
    UI.setupEventListeners();
    UI.loadLanguagePreference(); 
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

document.addEventListener('DOMContentLoaded', init);
