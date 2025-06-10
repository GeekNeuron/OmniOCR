import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { IDXParser } from './idx-parser.js';
import { SUBParser } from './sub-parser.js';

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
        const idxContent = await idx.text();
        const subBuffer = await sub.arrayBuffer();
        const metadata = IDXParser.parse(idxContent);
        
        let srtOutput = '';
        let subtitleCounter = 1;

        for (let i = 0; i < metadata.length; i++) {
            UI.updateProgress(`Processing subtitle ${subtitleCounter} of ${metadata.length}...`, i / metadata.length);
            const canvas = SUBParser.renderImageAt(subBuffer, metadata[i].filepos);
            if (canvas) {
                const text = await OCR.recognize(canvas, worker);
                const cleanedText = Postprocessor.cleanup(text, lang).trim();
                if (cleanedText) {
                    const startTime = metadata[i].timestamp;
                    const endTime = metadata[i + 1] ? metadata[i + 1].timestamp : getEndTime(startTime);
                    srtOutput += `${subtitleCounter++}\n${startTime} --> ${endTime}\n${cleanedText}\n\n`;
                }
            }
        }
        
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
 * Calculates a default end time by adding 2 seconds.
 */
function getEndTime(startTime) {
    const parts = startTime.match(/(\d+):(\d+):(\d+),(\d+)/);
    let [, hours, minutes, seconds, ms] = parts.map(Number);
    seconds += 2; // Add 2 seconds
    if (seconds >= 60) { minutes += 1; seconds -= 60; }
    if (minutes >= 60) { hours += 1; minutes -= 60; }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
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
    UI.populateLanguageOptions();
    UI.setupEventListeners();
    UI.loadLanguagePreference(); 
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

document.addEventListener('DOMContentLoaded', init);
