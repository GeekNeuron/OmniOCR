import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { Postprocessor } from './postprocessor.js';
import { Preprocessor } from './preprocessor.js';
import { API } from './apiHandlers.js';

/**
 * Converts a canvas to a Base64 string, stripping the data URI prefix.
 * @param {HTMLCanvasElement} canvas - The canvas to convert.
 * @returns {string | null} The Base64 data string or null if canvas is invalid.
 */
function canvasToBase64(canvas) {
    if (!canvas) return null;
    return canvas.toDataURL('image/png').split(',')[1];
}

/**
 * Handles .sub/.idx file processing using the vobsub.js library.
 * Can use either the local Tesseract worker or the advanced Cloud OCR.
 */
export const SubtitleHandler = {
    /**
     * Processes a pair of .sub and .idx files.
     * @param {File} subFile - The .sub file.
     * @param {File} idxFile - The .idx file.
     * @param {Tesseract.Worker | null} worker - The initialized Tesseract worker (for local mode).
     * @param {string} lang - The language code for OCR.
     * @param {boolean} isAdvanced - Flag to determine which OCR engine to use.
     * @param {object | null} apiKeys - The API keys for cloud services.
     * @returns {Promise<string>} A promise that resolves with the full SRT content.
     */
    process(subFile, idxFile, worker, lang, isAdvanced, apiKeys) {
        return new Promise((resolve, reject) => {
            if (typeof VobSub === 'undefined') {
                return reject(new Error("vobsub.js library is not loaded."));
            }

            const vobsub = new VobSub({
                subFile: subFile,
                idxFile: idxFile,
                debug: false,
                onReady: async () => {
                    try {
                        let srtOutput = '';
                        const totalSubs = vobsub.getSubtitleCount();
                        
                        if (totalSubs === 0) {
                            return reject(new Error("No subtitles were found in the provided files."));
                        }

                        for (let i = 0; i < totalSubs; i++) {
                            UI.updateProgress(`Processing subtitle ${i + 1} of ${totalSubs}...`, (i + 1) / totalSubs);
                            
                            const sub = await vobsub.getSubtitle(i);
                            const canvas = this.renderSubtitleToCanvas(sub);

                            if (canvas) {
                                let text = '';
                                if (isAdvanced && apiKeys) {
                                    const base64Image = canvasToBase64(canvas);
                                    if(base64Image) {
                                        text = await API.Google.recognize(base64Image, apiKeys.google);
                                    }
                                } else {
                                    text = await OCR.recognize(canvas, worker);
                                }
                                
                                const cleanedText = Postprocessor.cleanup(text, lang).trim();

                                if (cleanedText) {
                                    const startTime = this.formatTimestamp(sub.startTime);
                                    const endTime = this.formatTimestamp(sub.endTime);
                                    srtOutput += `${i + 1}\n`;
                                    srtOutput += `${startTime} --> ${endTime}\n`;
                                    srtOutput += `${cleanedText.replace(/\n/g, ' ')}\n\n`; // Ensure single line per sub
                                }
                            }
                        }
                        resolve(srtOutput);
                    } catch (error) {
                        reject(error);
                    }
                },
                onError: (error) => {
                    reject(new Error("Failed to parse subtitle files: " + (error.message || 'Unknown error')));
                }
            });
            vobsub.init();
        });
    },

    /**
     * Renders a subtitle object from vobsub.js to a canvas.
     */
    renderSubtitleToCanvas(sub) {
        if (!sub || !sub.imageData || !sub.width || !sub.height) {
            console.warn("Skipping invalid subtitle image data.");
            return null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = sub.width;
        canvas.height = sub.height;
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(new Uint8ClampedArray(sub.imageData), sub.width, sub.height);
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    /**
     * Formats a timestamp from milliseconds to SRT format (hh:mm:ss,ms).
     */
    formatTimestamp(ms) {
        if (isNaN(ms)) return "00:00:00,000";
        const date = new Date(0);
        date.setUTCMilliseconds(ms);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds},${milliseconds}`;
    }
};
