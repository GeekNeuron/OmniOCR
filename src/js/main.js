import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { PDFHandler } from './pdfHandler.js';
import { Postprocessor } from './postprocessor.js';
import { IDXParser } from './idx-parser.js';
import { SUBParser } from './sub-parser.js';

// --- State Management for SUB/IDX files ---
const fileCache = {
    idx: null,
    sub: null,
};

/**
 * Handles the logic for processing a pair of .sub and .idx files.
 */
async function handleSubtitleFiles() {
    const { idx, sub } = fileCache;
    if (!idx || !sub) return; // Should not happen if logic is correct

    UI.reset();
    const lang = UI.langSelect.value;
    
    try {
        await OCR.initialize(lang);

        // Read .idx as text and .sub as a binary buffer
        const idxContent = await idx.text();
        const subBuffer = await sub.arrayBuffer();
        
        // Parse the .idx file to get metadata
        const metadata = IDXParser.parse(idxContent);
        let srtOutput = '';
        let subtitleCounter = 1;

        for (let i = 0; i < metadata.length; i++) {
            const entry = metadata[i];
            const nextEntry = metadata[i + 1];
            
            UI.updateProgress(`Processing subtitle ${subtitleCounter} of ${metadata.length}...`, i / metadata.length);

            // Render the image from the .sub buffer at the given position
            const canvas = SUBParser.renderImageAt(subBuffer, entry.filepos);
            if (canvas) {
                const text = await OCR.recognize(canvas);
                const cleanedText = Postprocessor.cleanup(text, lang).trim();
                
                if (cleanedText) {
                    // Create the SRT block
                    const startTime = entry.timestamp;
                    // If there's a next entry, use its timestamp as the end time, otherwise add 2 seconds
                    const endTime = nextEntry ? nextEntry.timestamp : getEndTime(startTime);

                    srtOutput += `${subtitleCounter}\n`;
                    srtOutput += `${startTime} --> ${endTime}\n`;
                    srtOutput += `${cleanedText}\n\n`;
                    subtitleCounter++;
                }
            }
        }
        
        if (!srtOutput) {
            throw new Error("No text could be extracted from the subtitle files.");
        }

        UI.displayResult(srtOutput);

    } catch (error) {
        console.error('Subtitle Processing Error:', error);
        UI.displayError(error.message || 'An error occurred during subtitle processing.');
    } finally {
        OCR.terminate();
        // Clear the cache and file input for the next operation
        fileCache.idx = null;
        fileCache.sub = null;
        UI.fileInput.value = '';
    }
}

/**
 * Calculates a default end time by adding 2 seconds.
 * @param {string} startTime - The start timestamp in "hh:mm:ss,ms" format.
 */
function getEndTime(startTime) {
    const parts = startTime.match(/(\d+):(\d+):(\d+),(\d+)/);
    let [, hours, minutes, seconds, ms] = parts.map(Number);
    seconds += 2; // Add 2 seconds
    if (seconds >= 60) {
        minutes += 1;
        seconds -= 60;
    }
    if (minutes >= 60) {
        hours += 1;
        minutes -= 60;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}


/**
 * Main file handling logic. Routes files to the correct processor.
 * @param {FileList} files - The list of files from the input element.
 */
function handleFiles(files) {
    if (!files || files.length === 0) return;

    // Handle single Image or PDF files
    if (files.length === 1 && (files[0].type.startsWith('image/') || files[0].type === 'application/pdf')) {
        processSingleFile(files[0]);
        return;
    }

    // Handle SUB/IDX pairs
    for (const file of files) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (extension === 'idx') {
            fileCache.idx = file;
        } else if (extension === 'sub') {
            fileCache.sub = file;
        }
    }

    if (fileCache.idx && fileCache.sub) {
        handleSubtitleFiles();
    } else if (files.length > 1) {
        UI.displayError("For subtitles, please select both the .sub and .idx files together.");
    }
}

/**
 * Processes a single image or PDF file.
 */
async function processSingleFile(file) {
    UI.reset();
    const lang = UI.langSelect.value;
    
    try {
        await OCR.initialize(lang);

        let rawText = '';
        if (file.type === 'application/pdf') {
            rawText = await PDFHandler.process(file);
        } else { // It's an image
            rawText = await OCR.recognize(file);
        }

        const finalText = Postprocessor.cleanup(rawText, lang);
        UI.displayResult(finalText);

    } catch (error) {
        console.error('Processing Error:', error);
        UI.displayError(error.message || 'An unknown error occurred during processing.');
    } finally {
        OCR.terminate();
        UI.fileInput.value = '';
    }
}

/**
 * Initializes the application.
 */
function init() {
    UI.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    UI.setupEventListeners();
    console.log("OmniOCR Web App Initialized.");
}

document.addEventListener('DOMContentLoaded', init);
