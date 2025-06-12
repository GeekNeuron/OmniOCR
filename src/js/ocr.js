import { UI } from './ui.js';
import { AppConfig } from './config.js';
import { Preprocessor } from './preprocessor.js';

export const OCR = {
    worker: null,

    /**
     * Initializes the Tesseract worker with a specified language and parameters.
     * @param {string} lang - The language code for OCR (e.g., 'eng', 'fas').
     * @returns {Promise<Tesseract.Worker>} The initialized Tesseract worker.
     */
    async initialize(lang) {
        UI.updateProgress('Loading language model...', 0);
        const worker = await Tesseract.createWorker(lang, 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                   UI.updateProgress(`Recognizing text...`, m.progress);
                }
            }
        });

        // Set a character whitelist if available for the language.
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
            throw new Error("OCR engine worker is not initialized.");
        }
        
        // Preprocess the image for better accuracy before recognition.
        const preprocessedImage = await Preprocessor.process(imageSource);

        const { data: { text } } = await worker.recognize(preprocessedImage);
        return text;
    },
};
