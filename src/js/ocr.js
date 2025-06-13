import { UI } from './ui.js';
import { AppConfig } from './config.js';

/**
 * OCR Module
 * This module is a stateless wrapper around the Tesseract.js library.
 */
export const OCR = {
    /**
     * Initializes a new Tesseract worker with a specified language and parameters.
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

        const langs = langString.split('+');
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
     * Performs OCR on a given preprocessed image source.
     * This function now assumes the image is ALREADY preprocessed.
     * @param {HTMLCanvasElement|string} imageSource - The preprocessed image canvas or data URL.
     * @param {Tesseract.Worker} worker - The worker to use for recognition.
     * @returns {Promise<string>} The extracted text.
     */
    async recognize(imageSource, worker) {
        if (!worker) {
            throw new Error("OCR engine worker is not available.");
        }
        
        UI.updateProgress('Recognizing text...', 0.3);
        const { data: { text } } = await worker.recognize(imageSource);
        
        return text;
    },
};
