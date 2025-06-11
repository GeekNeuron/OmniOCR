import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { SubtitleHandler } from './subtitleHandler.js';
import { API } from './apiHandlers.js';

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
async function processWithCloud(file, apiKeys) {
    let enhancedImageUrl;
    
    // Step 1: Enhance image with Cloudinary (optional)
    if (apiKeys.cloudinaryCloudName) {
        UI.updateProgress('Enhancing image with Cloudinary...', 0.2);
        enhancedImageUrl = await API.Cloudinary.enhanceImage(file, apiKeys.cloudinaryCloudName, 'ml_default');
    }
    
    // Step 2: Perform OCR with Google Vision AI
    UI.updateProgress('Performing OCR with Google Vision AI...', 0.5);
    let ocrText;
    if (enhancedImageUrl) {
        ocrText = await API.Google.recognize(enhancedImageUrl, apiKeys.google);
    } else {
        // Fallback to sending base64 if Cloudinary is not used
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
            handleSubtitleFiles(); // Call the dedicated subtitle function
        } else if (fileCache.idx) {
            UI.showSubtitlePrompt("IDX file received. Please add the corresponding SUB file.");
        } else if (fileCache.sub) {
            UI.showSubtitlePrompt("SUB file received. Please add the corresponding IDX file.");
        }
        return; 
    }

    // --- Standard & Advanced File Processing ---
    if (files.length === 1) {
        const file = files[0];
        const isAdvanced = UI.isAdvancedMode();
        
        try {
            let rawText = '';

            if (isAdvanced) {
                const apiKeys = UI.getApiKeys();
                if (!apiKeys.google) {
                    throw new Error("Google Vision API Key is required for Advanced Mode. Please turn off Advanced Mode or provide a key.");
                }
                rawText = await processWithCloud(file, apiKeys);
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
            
            const lang = isAdvanced ? 'eng' : UI.getSelectedLanguage(); 
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
    
    const file = files[0];
    const isAdvanced = UI.isAdvancedMode();
    const lang = UI.getSelectedLanguage(); // For post-processing
    
    try {
        let rawText = '';

        if (isAdvanced) {
            // --- ADVANCED MODE LOGIC ---
            let apiKey = UI.getApiKey();
            if (!apiKey) {
                apiKey = UI.promptForApiKey();
                if (!apiKey) {
                    UI.advancedToggle.checked = false;
                    UI.updateSubtitle();
                    throw new Error("API Key is required for Advanced Mode. Switched to Local Mode.");
                }
            }
            UI.updateProgress("Uploading to cloud for advanced OCR...", 0.3);
            const base64Image = await toBase64(file);
            rawText = await CloudOCR.recognize(base64Image, apiKey);

        } else {
            // --- LOCAL MODE LOGIC ---
            const worker = await getLocalOcrEngine(lang);
            
            if (file.type === 'application/pdf') {
                rawText = await PDFHandler.process(file, worker);
            } else if (file.type.startsWith('image/')) {
                rawText = await OCR.recognize(file, worker);
            } else {
                 throw new Error('Unsupported file format. For subtitles, please select both .sub and .idx files.');
            }
        }

        const finalText = Postprocessor.cleanup(rawText, lang);
        UI.displayResult(finalText, 'txt');

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message || 'An unknown error occurred.');
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
