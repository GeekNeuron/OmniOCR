import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
// ** MODIFICATION: Replace old parsers with the new professional handler **
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
 * Handles the logic for processing a pair of .sub and .idx files.
 */
async function handleSubtitleFiles() {
    const { idx, sub } = fileCache;
    const lang = UI.getSelectedLanguage();
    try {
        const worker = await getOcrEngine(lang);
        
        // ** MODIFICATION: Use the new SubtitleHandler instead of manual parsing **
        const srtOutput = await SubtitleHandler.process(sub, idx, worker, lang);
        
        if (!srtOutput) {
            throw new Error("No text could be extracted from the subtitle files.");
        }
        
        UI.displayResult(srtOutput, 'srt');
        
    } catch (error) {
        console.error('Subtitle Processing Error:', error);
        UI.displayError(error.message || 'An error occurred during subtitle processing.');
    } finally {
        // Clear cache and file input for the next operation
        fileCache.idx = null;
        fileCache.sub = null;
        UI.fileInput.value = '';
    }
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
            handleSubtitleFiles();
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
            UI.displayResult(finalText, 'txt');
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
