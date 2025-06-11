import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { SubtitleHandler } from './subtitleHandler.js';
import { CloudOCR } from './cloudOcr.js';

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
        // For canvas, directly get the data URL
        if (source instanceof HTMLCanvasElement) {
            resolve(source.toDataURL('image/png').split(',')[1]);
            return;
        }
        // For files, use FileReader
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(source);
    });
}

/**
 * Main file handling logic. Routes files to the correct processor.
 */
async function handleFiles(files) {
    if (!files || files.length === 0) return;

    UI.reset();
    
    // For subtitles, we always use the local engine for now
    // as cloud processing is a future enhancement.
    if (files.length > 1) {
        // (Smart subtitle handling logic using local engine remains the same)
        return; 
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
