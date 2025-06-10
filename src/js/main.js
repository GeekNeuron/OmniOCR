import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';

const fileCache = { idx: null, sub: null };
let ocrEngineCache = { worker: null, lang: null };

/**
 * Gets the OCR engine, either from cache or by initializing a new one.
 * This improves performance for sequential operations with the same language.
 */
async function getOcrEngine(lang) {
    if (ocrEngineCache.worker && ocrEngineCache.lang === lang) {
        console.log("Using cached OCR engine.");
        return ocrEngineCache.worker;
    }
    
    console.log("Initializing new OCR engine...");
    if (ocrEngineCache.worker) {
        await ocrEngineCache.worker.terminate();
    }
    
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
        return; 
    }

    // --- Standard File Processing for Single Files ---
    if (files.length === 1) {
        const file = files[0];
        const lang = UI.getSelectedLanguage();
        try {
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
            UI.fileInput.value = '';
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
