import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { Preprocessor } from './preprocessor.js';
import { SubtitleHandler } from './subtitleHandler.js';
import { API } from './apiHandlers.js';

const fileCache = { idx: null, sub: null };
let ocrEngineCache = { worker: null, lang: null };

/**
 * Gets the local OCR engine, either from cache or by initializing a new one.
 */
async function getLocalOcrEngine(langString) {
    if (ocrEngineCache.worker && ocrEngineCache.lang === langString) {
        console.log("Using cached OCR engine.");
        return ocrEngineCache.worker;
    }
    
    console.log("Initializing new OCR engine for:", langString);
    if (ocrEngineCache.worker) {
        await ocrEngineCache.worker.terminate();
    }
    
    const worker = await OCR.initialize(langString);
    ocrEngineCache = { worker, lang: langString };
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
 * Executes the advanced cloud-based OCR pipeline for a single image/page.
 */
async function processWithCloud(file, apiKeys) {
    // Step 1: Enhance image with Cloudinary (optional)
    UI.updateProgress('Enhancing image with Cloudinary...', 0.2);
    const enhancedImageUrl = await API.Cloudinary.enhanceImage(file, apiKeys.cloudinaryCloudName);
    
    // Step 2: Perform OCR with Google Vision AI
    UI.updateProgress('Performing OCR with Google Vision AI...', 0.5);
    let ocrText;
    if (enhancedImageUrl) {
        ocrText = await API.Google.recognize(enhancedImageUrl, apiKeys.google);
    } else {
        const base64Image = await toBase64(file);
        ocrText = await API.Google.recognize(base64Image, apiKeys.google);
    }

    // Step 3: Correct grammar with Hugging Face (optional)
    if (apiKeys.huggingFace && ocrText) {
        UI.updateProgress('Correcting grammar with Hugging Face...', 0.8);
        ocrText = await API.HuggingFace.correctGrammar(ocrText, apiKeys.huggingFace);
    }

    return ocrText;
}

/**
 * Returns the currently stored API keys, or re-prompts the user for them if
 * Advanced Mode is on but no Google key is available (e.g. localStorage says
 * advancedMode=true but sessionStorage was cleared in a new browser session).
 * Throws if the user cancels or still doesn't provide a key.
 */
async function getOrPromptApiKeys() {
    let apiKeys = UI.getApiKeys();
    if (!apiKeys.google) {
        apiKeys = await UI.promptForApiKeys();
        if (!apiKeys || !apiKeys.google) {
            throw new Error("Google Vision API Key is required for Advanced Mode. Please turn off Advanced Mode or provide a key.");
        }
    }
    return apiKeys;
}

/**
 * Handles the logic for processing a pair of .sub and .idx files using vobsub.js.
 * Routes each extracted subtitle bitmap through either the local Tesseract engine
 * or the cloud (Google Vision) pipeline, depending on the current mode.
 */
async function handleSubtitleFiles() {
    const { idx, sub } = fileCache;
    try {
        const isAdvanced = UI.isAdvancedMode();
        const primaryLang = UI.getSelectedLanguage();
        let worker = null;
        let apiKeys = null;

        if (isAdvanced) {
            apiKeys = await getOrPromptApiKeys();
        } else {
            const langString = (primaryLang !== 'eng') ? `${primaryLang}+eng` : 'eng';
            worker = await getLocalOcrEngine(langString);
        }

        const srtOutput = await SubtitleHandler.process(sub, idx, worker, primaryLang, isAdvanced, apiKeys);

        if (!srtOutput) {
            throw new Error("No subtitle text could be extracted from the provided files.");
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
 * Runs the full OCR pipeline (cloud or local) for a single image/PDF file and
 * returns the postprocessed text. Shared by both the single-file and batch paths.
 */
async function processSingleFile(file, { primaryLang, isAdvanced, apiKeys, worker }) {
    let rawText = '';
    if (isAdvanced) {
        rawText = await processWithCloud(file, apiKeys);
    } else {
        if (file.type === 'application/pdf') {
            rawText = await PDFHandler.process(file, worker);
        } else if (file.type.startsWith('image/')) {
            const preprocessedImage = await Preprocessor.process(file, { binarize: UI.isBinarizeEnabled() });
            rawText = await OCR.recognize(preprocessedImage, worker);
        } else {
            throw new Error('Unsupported file format.');
        }
    }
    return Postprocessor.cleanup(rawText, primaryLang);
}

/**
 * Main file handling logic. Routes files to the correct processor.
 */
async function handleFiles(files) {
    if (!files || files.length === 0) return;

    UI.reset();

    // --- Smart Subtitle Handling ---
    let isSubtitleJob = false;
    for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension === 'sub') fileCache.sub = file;
        if (extension === 'idx') fileCache.idx = file;
    }
    if (fileCache.sub || fileCache.idx) isSubtitleJob = true;

    if (isSubtitleJob) {
        if (fileCache.idx && fileCache.sub) {
            handleSubtitleFiles();
        } else {
            UI.showSubtitlePrompt(`Received ${fileCache.idx ? 'IDX' : 'SUB'}. Please add the corresponding file.`);
        }
        return;
    }

    // --- Image & PDF Processing (single file or batch) ---
    const isAdvanced = UI.isAdvancedMode();
    const primaryLang = UI.getSelectedLanguage();

    try {
        let apiKeys = null;
        let worker = null;

        if (isAdvanced) {
            apiKeys = await getOrPromptApiKeys();
        } else {
            const langString = (primaryLang !== 'eng') ? `${primaryLang}+eng` : 'eng';
            worker = await getLocalOcrEngine(langString);
        }

        if (files.length === 1) {
            const finalText = await processSingleFile(files[0], { primaryLang, isAdvanced, apiKeys, worker });
            UI.displayResult(finalText, 'txt');
        } else {
            // Batch: process each file sequentially, reusing the same worker/apiKeys.
            // One file's failure doesn't stop the rest — it's noted inline and processing continues.
            const parts = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                UI.updateProgress(`Processing file ${i + 1} of ${files.length}: ${file.name}`, i / files.length);
                try {
                    const finalText = await processSingleFile(file, { primaryLang, isAdvanced, apiKeys, worker });
                    parts.push(`=== ${file.name} ===\n\n${finalText}`);
                } catch (fileError) {
                    console.error(`Batch processing error on ${file.name}:`, fileError);
                    parts.push(`=== ${file.name} ===\n\n[Error: ${fileError.message}]`);
                }
            }
            UI.displayResult(parts.join('\n\n\n'), 'txt');
        }
    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message);
    } finally {
        UI.fileInput.value = '';
    }
}

function init() {
    UI.populateLanguageOptions();
    UI.setupEventListeners();
    UI.loadLanguagePreference(); 
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

document.addEventListener('DOMContentLoaded', init);
