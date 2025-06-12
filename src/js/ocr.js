import { UI } from './ui.js';
import { Preprocessor } from './preprocessor.js';
import { AppConfig } from './config.js';

export const OCR = {
    worker: null,

    /**
     * Initializes the Tesseract worker with a specified language and parameters.
     * @param {string} lang - The language code for OCR (e.g., 'eng', 'fas').
     */
    async initialize(lang) {
        UI.updateProgress('Loading language model...', 0);
        this.worker = await Tesseract.createWorker(lang, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                   UI.updateProgress(`Recognizing text...`, m.progress);
                }
            }
        });

        // **IMPROVEMENT**: Dynamically set a character whitelist if available for the language.
        // This dramatically reduces "hallucinated" characters from other scripts.
        if (AppConfig.whitelists[lang]) {
            await this.worker.setParameters({
                tessedit_char_whitelist: AppConfig.whitelists[lang],
            });
            console.log(`Whitelist applied for language: ${lang}`);
        }
    },

    /**
     * Performs OCR on a given preprocessed image source.
     * @param {string} preprocessedImage - The preprocessed image data URL.
     * @param {Tesseract.Worker} worker - The worker to use for recognition.
     * @returns {Promise<string>} The extracted text.
     */
    async recognize(preprocessedImage, worker) {
        if (!worker) {
            throw new Error("OCR engine worker is not initialized.");
        }
        const { data: { text } } = await worker.recognize(preprocessedImage);
        return text;
    },

    /**
     * Terminates the Tesseract worker to free up resources.
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
};
