import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { Postprocessor } from './postprocessor.js';
import { Preprocessor } from './preprocessor.js';

/**
 * Handles .sub/.idx file processing using the vobsub.js library.
 */
export const SubtitleHandler = {
    /**
     * Processes a pair of .sub and .idx files.
     * @param {File} subFile - The .sub file.
     * @param {File} idxFile - The .idx file.
     * @param {Tesseract.Worker} worker - The initialized Tesseract worker.
     * @param {string} lang - The language code for OCR.
     * @returns {Promise<string>} A promise that resolves with the full SRT content.
     */
    process(subFile, idxFile, worker, lang) {
        return new Promise((resolve, reject) => {
            if (typeof VobSub === 'undefined') {
                return reject(new Error("vobsub.js library is not loaded. Please check the file path."));
            }

            const vobsub = new VobSub({
                subFile: subFile,
                idxFile: idxFile,
                debug: false, // Set to true for development console logs
                onReady: async () => {
                    try {
                        let srtOutput = '';
                        const totalSubs = vobsub.getSubtitleCount();
                        
                        if (totalSubs === 0) {
                            return reject(new Error("No subtitles were found in the provided files."));
                        }

                        for (let i = 0; i < totalSubs; i++) {
                            UI.updateProgress(`Processing subtitle ${i + 1} of ${totalSubs}...`, (i + 1) / totalSubs);
                            
                            const sub = vobsub.getSubtitle(i);
                            const canvas = this.renderSubtitleToCanvas(sub);

                            if (canvas) {
                                // Use the advanced preprocessor to enhance the image
                                const preprocessedImage = await Preprocessor.process(canvas);
                                const text = await OCR.recognize(preprocessedImage, worker);
                                const cleanedText = Postprocessor.cleanup(text, lang).trim();

                                if (cleanedText) {
                                    const startTime = this.formatTimestamp(sub.startTime);
                                    const endTime = this.formatTimestamp(sub.endTime);
                                    srtOutput += `${i + 1}\n`;
                                    srtOutput += `${startTime} --> ${endTime}\n`;
                                    srtOutput += `${cleanedText}\n\n`;
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
        if (!sub.imageData || !sub.width || !sub.height) {
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
        const date = new Date(0);
        date.setUTCMilliseconds(ms);
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds},${milliseconds}`;
    }
};
