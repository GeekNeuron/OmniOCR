import { UI } from './ui.js';
import { AppConfig } from './config.js';
import { Preprocessor } from './preprocessor.js';

/**
 * OCR Module
 * This module is a stateless wrapper around the Tesseract.js library.
 * It initializes a worker and performs recognition.
 */
export const OCR = {
    /**
     * Initializes a new Tesseract worker with a specified language string and parameters.
     * @param {string} langString - The language code(s) for OCR (e.g., 'eng', 'fas+eng').
     * @returns {Promise<Tesseract.Worker>} The initialized Tesseract worker.
     */
    async initialize(langString) {
        UI.updateProgress('Loading language model(s)...', 0);
        
        const worker = await Tesseract.createWorker(langString, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                   UI.updateProgress(`Recognizing text... (${Math.round(m.progress * 100)}%)`, m.progress);
                }
            }
        });

        // Split the language string (e.g., "fas+eng") into an array (['fas', 'eng'])
        const langs = langString.split('+');
        
        // Get the combined whitelist for all specified languages.
        const combinedWhitelist = AppConfig.getCombinedWhitelist(langs);
        
        if (combinedWhitelist) {
            await worker.setParameters({
                tessedit_char_whitelist: combinedWhitelist,
            });
            console.log(`Whitelist applied for languages: ${langs.join(', ')}`);
        }
        
        return worker;
    },

    /**
     * Performs OCR on a given image source using the provided worker.
     * @param {File|HTMLCanvasElement} imageSource - The image file or canvas to process.
     * @param {Tesseract.Worker} worker - The worker to use for recognition.
     * @returns {Promise<string>} The extracted text.
     */
    async recognize(imageSource, worker) {
        if (!worker) {
            throw new Error("OCR engine worker is not available.");
        }
        
        UI.updateProgress('Preprocessing image...', 0.1); // Give user feedback
        const preprocessedImage = await Preprocessor.process(imageSource);
        
        UI.updateProgress('Recognizing text...', 0.3); // Initial recognition status
        const { data: { text } } = await worker.recognize(preprocessedImage);
        
        return text;
    },
};
