import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { SubtitleHandler } from './subtitleHandler.js';
import { API } from './apiHandlers.js';

const fileCache = { idx: null, sub: null };
let ocrEngineCache = { worker: null, lang: null };

/**
 * Gets the local OCR engine, either from cache or by initializing a new one.
 */
async function getLocalOcrEngine(lang) {
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
 * Converts a file or canvas to a Base64 string, stripping the data URI prefix.
 * @param {File|HTMLCanvasElement} source - The file or canvas to convert.
 * @returns {Promise<string>} A promise that resolves with the Base64 data string.
 */
function toBase64(source) {
    return new Promise((resolve, reject) => {
        if (source instanceof HTMLCanvasElement) {
            resolve(source.toDataURL('image/png').split(',')[1]);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(source);
    });
}

/**
 * Executes the advanced cloud-based OCR pipeline.
 */
async function processWithCloud(file) {
    const apiKeys = UI.getApiKeys();
    if (!apiKeys.google) {
        throw new Error("Google Vision API Key is required for Advanced Mode.");
    }
    
    // For now, we will directly send the file to Google Vision.
    // The Cloudinary and Hugging Face steps can be added later.
    UI.updateProgress("Uploading to cloud for advanced OCR...", 0.3);
    const base64Image = await toBase64(file);
    const ocrText = await API.Google.recognize(base64Image, apiKeys.google);

    return ocrText;
}

/**
 * Handles the logic for processing a pair of .sub and .idx files (always locally).
 */
async function handleSubtitleFiles() {
    const { idx, sub } = fileCache;
    const lang = UI.getSelectedLanguage();
    try {
        const worker = await getLocalOcrEngine(lang);
        const srtOutput = await SubtitleHandler.process(sub, idx, worker, lang);
        
        if (!srtOutput) {
            throw new Error("No text could be extracted from the subtitle files.");
        }
        
        UI.displayResult(srtOutput, 'srt');
        
    } catch (error) {
        console.error('Subtitle Processing Error:', error);
        UI.displayError(error.message || 'An error occurred during subtitle processing.');
    } finally {
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
    let isSubtitleJob = false;
    for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension === 'sub') fileCache.sub = file;
        if (extension === 'idx') fileCache.idx = file;
    }
    
    if (fileCache.sub || fileCache.idx) {
        isSubtitleJob = true;
    }

    if (isSubtitleJob) {
        if (fileCache.idx && fileCache.sub) {
            // Advanced mode does not apply to subtitles yet, so we use the local handler.
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
        const isAdvanced = UI.isAdvancedMode();
        
        try {
            let rawText = '';

            if (isAdvanced) {
                rawText = await processWithCloud(file);
            } else {
                const lang = UI.getSelectedLanguage();
                const worker = await getLocalOcrEngine(lang);
                if (file.type === 'application/pdf') {
                    rawText = await PDFHandler.process(file, worker);
                } else if (file.type.startsWith('image/')) {
                    rawText = await OCR.recognize(file, worker);
                } else {
                    throw new Error('Unsupported file format.');
                }
            }
            
            // Post-processing is universal
            const lang = isAdvanced ? 'eng' : UI.getSelectedLanguage(); // Use a default for cloud or detect later
            const finalText = Postprocessor.cleanup(rawText, lang);
            UI.displayResult(finalText, 'txt');

        } catch (error) {
            console.error('Processing Error:', error);
            UI.displayError(error.message);
        } finally {
            UI.fileInput.value = '';
        }
    } else if (files.length > 1) {
        UI.displayError("Please upload only one file at a time (or a matching .sub/.idx pair).");
    }
}

function init() {
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/js/libraries/pdf.worker.min.js';
    }
    UI.populateLanguageOptions();
    UI.setupEventListeners();
    UI.loadLanguagePreference(); 
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

document.addEventListener('DOMContentLoaded', init);
