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
     * Performs OCR on a given image file after preprocessing it.
     * @param {File|HTMLCanvasElement} imageSource - The image file or canvas to process.
     * @returns {Promise<string>} The extracted text.
     */
    async recognize(imageSource) {
        if (!this.worker) {
            throw new Error("OCR engine is not initialized.");
        }
        
        UI.updateProgress('Preprocessing image...', 0.25);
        const preprocessedImage = await Preprocessor.process(imageSource);

        const { data: { text } } = await this.worker.recognize(preprocessedImage);
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
