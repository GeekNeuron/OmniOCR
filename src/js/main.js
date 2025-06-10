import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { SubtitleHandler } from './subtitleHandler.js';

const fileCache = { idx: null, sub: null };
let ocrEngineCache = { worker: null, lang: null };

/**
 * Gets the OCR engine, either from cache or by initializing a new one.
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

    const lang = UI.getSelectedLanguage();
    try {
        let rawText = '';
        let fileType = 'txt';

        if (hasSub || hasIdx) {
            if (fileCache.idx && fileCache.sub) {
                const worker = await getOcrEngine(lang);
                rawText = await SubtitleHandler.process(fileCache.sub, fileCache.idx, worker, lang);
                fileType = 'srt';
            } else if (fileCache.idx) {
                UI.showSubtitlePrompt("IDX file received. Please add the corresponding SUB file.");
                return;
            } else if (fileCache.sub) {
                UI.showSubtitlePrompt("SUB file received. Please add the corresponding IDX file.");
                return;
            }
        } else if (files.length === 1) {
            const file = files[0];
            const worker = await getOcrEngine(lang);
            if (file.type === 'application/pdf') {
                rawText = await PDFHandler.process(file, worker);
            } else if (file.type.startsWith('image/')) {
                rawText = await OCR.recognize(file, worker);
            } else {
                throw new Error('Unsupported file format. Please use JPG, PNG, PDF, or a SUB+IDX pair.');
            }
        } else if (files.length > 1) {
            throw new Error("Please upload only one file at a time (or a matching .sub/.idx pair).");
        }

        if (rawText) {
             const finalText = Postprocessor.cleanup(rawText, lang);
             UI.displayResult(finalText, fileType);
        }

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message || 'An unknown error occurred.');
    } finally {
        // Reset cache and input only if not waiting for a paired file
        if (!((hasSub && !hasIdx) || (hasIdx && !hasSub))) {
            fileCache.idx = null;
            fileCache.sub = null;
            UI.fileInput.value = '';
        }
    }
}

function init() {
    // Set PDF.js worker path locally
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/js/libraries/pdf.worker.min.js';
    }
    UI.populateLanguageOptions();
    UI.setupEventListeners();
    UI.loadLanguagePreference(); 
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

document.addEventListener('DOMContentLoaded', init);
