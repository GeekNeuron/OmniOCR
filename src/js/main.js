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
        return ocrEngineCache.worker;
    }
    if (ocrEngineCache.worker) {
        await ocrEngineCache.worker.terminate();
    }
    const worker = await OCR.initialize(lang);
    ocrEngineCache = { worker, lang };
    return worker;
}

/**
 * Converts a file or canvas to a Base64 string, stripping the data URI prefix.
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
async function processWithCloud(file, apiKeys) {
    let finalOcrText;

    // Step 1: Enhance image with Cloudinary (optional)
    UI.updateProgress('Enhancing image with Cloudinary...', 0.2);
    const enhancedImageUrl = await API.Cloudinary.enhanceImage(file, apiKeys.cloudinaryCloudName, 'ml_default');
    
    // Step 2: Perform OCR with Google Vision AI
    UI.updateProgress('Performing OCR with Google Vision AI...', 0.5);
    if (enhancedImageUrl) {
        finalOcrText = await API.Google.recognize(enhancedImageUrl, apiKeys.google);
    } else {
        // Fallback to sending base64 if Cloudinary fails or is not configured
        const base64Image = await toBase64(file);
        finalOcrText = await API.Google.recognize(base64Image, apiKeys.google);
    }

    // Step 3: Correct grammar with Hugging Face (optional)
    if (apiKeys.huggingFace && finalOcrText) {
        UI.updateProgress('Correcting grammar with Hugging Face...', 0.8);
        finalOcrText = await API.HuggingFace.correctGrammar(finalOcrText, apiKeys.huggingFace);
    }

    return finalOcrText;
}

/**
 * Main file handling logic. Routes files to the correct processor.
 */
async function handleFiles(files) {
    if (!files || files.length === 0) return;

    UI.reset();

    // --- Smart Subtitle Handling Logic ---
    if (files.length > 1) {
        let hasSub = false, hasIdx = false;
        for (const file of files) {
            const extension = file.name.split('.').pop().toLowerCase();
            if (extension === 'sub') fileCache.sub = file;
            if (extension === 'idx') fileCache.idx = file;
        }
        if (fileCache.idx && fileCache.sub) {
            // Subtitles are always processed locally for now.
            const lang = UI.getSelectedLanguage();
            const worker = await getLocalOcrEngine(lang);
            const srt = await SubtitleHandler.process(fileCache.sub, fileCache.idx, worker, lang);
            UI.displayResult(srt, 'srt');
            fileCache.idx = null; fileCache.sub = null;
        } else {
            UI.displayError("For subtitles, please select both the .sub and .idx files together.");
        }
        UI.fileInput.value = '';
        return;
    }
    
    const file = files[0];
    const isAdvanced = UI.isAdvancedMode();
    const lang = UI.getSelectedLanguage();
    
    try {
        let rawText = '';
        let fileType = 'txt';

        if (isAdvanced) {
            const apiKeys = UI.getApiKeys();
            if (!apiKeys.google) {
                throw new Error("Google Vision API Key is required for Advanced Mode. Please turn it off or provide a key.");
            }
            rawText = await processWithCloud(file, apiKeys);
        } else {
            const worker = await getLocalOcrEngine(lang);
            if (file.type === 'application/pdf') {
                rawText = await PDFHandler.process(file, worker);
            } else if (file.type.startsWith('image/')) {
                rawText = await OCR.recognize(file, worker);
            } else {
                throw new Error('Unsupported file format.');
            }
        }
            
        const finalText = Postprocessor.cleanup(rawText, lang);
        UI.displayResult(finalText, fileType);

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message);
    } finally {
        UI.fileInput.value = '';
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
