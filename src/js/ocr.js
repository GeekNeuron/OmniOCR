import { UI } from './ui.js';

export const OCR = {
    worker: null,

    /**
     * Initializes the Tesseract worker with a specified language.
     * @param {string} lang - The language code for OCR (e.g., 'eng', 'fas').
     */
    async initialize(lang) {
        UI.updateProgress('Loading language model...', 0);
        this.worker = await Tesseract.createWorker(lang, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                   // The progress object from Tesseract is a value between 0 and 1.
                   UI.updateProgress(`Recognizing text...`, m.progress);
                }
            }
        });
    },

    /**
     * Performs OCR on a given image file.
     * @param {File} imageFile - The image file to process.
     * @returns {Promise<string>} The extracted text.
     */
    async recognize(imageFile) {
        if (!this.worker) {
            throw new Error("OCR engine is not initialized.");
        }
        const { data: { text } } = await this.worker.recognize(imageFile);
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
