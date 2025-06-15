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
 * Handles the logic for processing a pair of .sub and .idx files using FFmpeg.
 */
async function handleSubtitleFiles() {
    const { idx, sub } = fileCache;
    try {
        // The new SubtitleHandler with FFmpeg is mode-agnostic and is the best approach.
        const srtOutput = await SubtitleHandler.process(sub, idx);
        
        if (!srtOutput) {
            throw new Error("FFmpeg failed to extract any subtitle text.");
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

    // --- Image & PDF Processing ---
    if (files.length === 1) {
        const file = files[0];
        const isAdvanced = UI.isAdvancedMode();
        
        try {
            let rawText = '';
            const primaryLang = UI.getSelectedLanguage();

            if (isAdvanced) {
                const apiKeys = UI.getApiKeys();
                if (!apiKeys.google) {
                    throw new Error("Google Vision API Key is required for Advanced Mode. Please turn off Advanced Mode or provide a key.");
                }
                rawText = await processWithCloud(file, apiKeys);
            } else {
                const langString = (primaryLang !== 'eng') ? `${primaryLang}+eng` : 'eng';
                const worker = await getLocalOcrEngine(langString);
                
                if (file.type === 'application/pdf') {
                    rawText = await PDFHandler.process(file, worker);
                } else if (file.type.startsWith('image/')) {
                    const preprocessedImage = await Preprocessor.process(file);
                    rawText = await OCR.recognize(preprocessedImage, worker);
                } else {
                    throw new Error('Unsupported file format.');
                }
            }
            
            const finalText = Postprocessor.cleanup(rawText, primaryLang);
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
    UI.populateLanguageOptions();
    UI.setupEventListeners();
    UI.loadLanguagePreference(); 
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

document.addEventListener('DOMContentLoaded', init);
