import { UI } from './ui.js';
import { AppConfig } from './config.js';

// Languages we've bundled traineddata for locally (src/js/lang-data/). Any other
// language falls back to Tesseract.js's default CDN langPath (requires internet
// the first time that language is used).
const OFFLINE_LANGS = new Set(['eng', 'fas', 'ara']);
const LOCAL_CORE_PATH = 'src/js/libraries/tesseract-core/';
const LOCAL_LANG_PATH = 'src/js/lang-data/';
const LOCAL_WORKER_PATH = 'src/js/libraries/worker.min.js';

/**
 * Checks whether a local asset actually exists (vs. just being planned for).
 * Used so each offline asset (core/worker/lang) degrades independently to the
 * CDN default if it hasn't been bundled yet, instead of one missing file
 * breaking OCR entirely.
 */
async function localFileExists(path) {
    try {
        const res = await fetch(path, { method: 'HEAD' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

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

        const langs = langString.split('+');
        const workerOptions = {
            logger: m => {
                if (m.status === 'recognizing text') {
                   UI.updateProgress(`Recognizing text... (${Math.round(m.progress * 100)}%)`, m.progress);
                }
            }
        };

        const [coreOk, workerOk, langOk] = await Promise.all([
            localFileExists(`${LOCAL_CORE_PATH}tesseract-core-simd-lstm.wasm.js`),
            localFileExists(LOCAL_WORKER_PATH),
            langs.every(l => OFFLINE_LANGS.has(l))
                ? localFileExists(`${LOCAL_LANG_PATH}${langs[0]}.traineddata.gz`)
                : Promise.resolve(false)
        ]);

        if (coreOk) workerOptions.corePath = LOCAL_CORE_PATH;
        if (workerOk) workerOptions.workerPath = LOCAL_WORKER_PATH;
        if (langOk) workerOptions.langPath = LOCAL_LANG_PATH;

        if (!(coreOk && workerOk && langOk)) {
            const missing = [!coreOk && 'core', !workerOk && 'worker', !langOk && 'lang-data'].filter(Boolean);
            console.warn(`Running with some offline assets missing (${missing.join(', ')}) — falling back to CDN for those. Internet is required on first use until they're bundled.`);
        }

        const worker = await Tesseract.createWorker(langString, 1, workerOptions);

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
     * @param {object} [options] - Optional settings.
     * @param {boolean} [options.singleLine] - Set when imageSource is a tightly-cropped
     *   single line of text (e.g. one subtitle line). Tesseract's default automatic page
     *   segmentation frequently finds no text at all on such small crops.
     * @returns {Promise<string>} The extracted text.
     */
    async recognize(imageSource, worker, options = {}) {
        if (!worker) {
            throw new Error("OCR engine worker is not available.");
        }
        
        UI.updateProgress('Recognizing text...', 0.3);

        if (options.singleLine) {
            // PSM 7 ("single text line") works well for both Persian and Latin single-line
            // crops in testing, but occasionally finds nothing at all on some Latin/stylized
            // credit-font lines. PSM 13 ("raw line", no layout heuristics) reliably catches
            // those - but is unreliable for Persian - so it's only used as a fallback.
            await worker.setParameters({ tessedit_pageseg_mode: '7' });
            let { data } = await worker.recognize(imageSource);
            if (!data.text || !data.text.trim()) {
                await worker.setParameters({ tessedit_pageseg_mode: '13' });
                ({ data } = await worker.recognize(imageSource));
            }
            return data.text;
        }

        await worker.setParameters({ tessedit_pageseg_mode: '3' });
        const { data: { text } } = await worker.recognize(imageSource);
        return text;
    },
};
