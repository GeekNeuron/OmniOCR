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
     * Initializes a new Tesseract worker with a specified language and parameters.
     * @param {string} lang - The language code for OCR (e.g., 'eng', 'fas').
     * @returns {Promise<Tesseract.Worker>} The initialized Tesseract worker.
     */
    async initialize(lang) {
        UI.updateProgress('Loading language model...', 0);
        
        const worker = await Tesseract.createWorker(lang, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                   UI.updateProgress(`Recognizing text... (${Math.round(m.progress * 100)}%)`, m.progress);
                }
            }
        });

        // Set a character whitelist if available for the language.
        // This dramatically reduces "hallucinated" characters from other scripts.
        if (AppConfig.whitelists[lang]) {
            await worker.setParameters({
                tessedit_char_whitelist: AppConfig.whitelists[lang],
            });
            console.log(`Whitelist applied for language: ${lang}`);
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
