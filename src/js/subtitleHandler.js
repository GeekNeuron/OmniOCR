import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { Postprocessor } from './postprocessor.js';
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
                            const lineCanvases = this.renderSubtitleToLineCanvases(sub);

                            if (lineCanvases.length > 0) {
                                const lineTexts = [];
                                for (const canvas of lineCanvases) {
                                    let text = '';
                                    if (isAdvanced && apiKeys) {
                                        const base64Image = canvasToBase64(canvas);
                                        if (base64Image) {
                                            text = await API.Google.recognize(base64Image, apiKeys.google);
                                        }
                                    } else {
                                        text = await OCR.recognize(canvas, worker, { singleLine: true });
                                    }
                                    const cleanedLine = Postprocessor.cleanup(text, lang).trim().replace(/\n/g, ' ');
                                    if (cleanedLine) lineTexts.push(cleanedLine);
                                }

                                if (lineTexts.length > 0) {
                                    const startTime = this.formatTimestamp(sub.startTime);
                                    const endTime = this.formatTimestamp(sub.endTime);
                                    srtOutput += `${i + 1}\n`;
                                    srtOutput += `${startTime} --> ${endTime}\n`;
                                    srtOutput += `${lineTexts.join('\n')}\n\n`;
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
     * Finds contiguous vertical bands of "ink" rows in a black-on-white bitmap,
     * i.e. individual text lines, by scanning for horizontal whitespace gaps.
     * Small gaps (a few px, e.g. between a dot and its letter) are absorbed into
     * the same band; a gap of at least minGap rows is treated as a real line break.
     * Returns an array of [startY, endY] (inclusive) pairs.
     */
    _detectLineBands(rowHasInk, minGap = 4) {
        const bands = [];
        const n = rowHasInk.length;
        let i = 0;
        while (i < n && !rowHasInk[i]) i++;
        while (i < n) {
            const start = i;
            let j = i;
            while (j < n) {
                if (rowHasInk[j]) { j++; continue; }
                let k = j;
                while (k < n && !rowHasInk[k]) k++;
                if (k - j >= minGap || k === n) break; // real gap, or ran off the end
                j = k; // small gap - absorb it and keep extending this band
            }
            bands.push([start, j - 1]);
            i = j;
            while (i < n && !rowHasInk[i]) i++;
        }
        return bands;
    },

    /**
     * Renders one subtitle's decoded pixels into a set of upscaled, padded
     * line-images - one per detected text line - ready for OCR. Splitting multi-line
     * subtitles (very common: credits with native+translated name stacked, or just
     * ordinary 2-line dialogue) avoids Tesseract trying to read unrelated lines as
     * one blob, and lets each line's OCR result map to its own line in the output.
     */
    renderSubtitleToLineCanvases(sub) {
        if (!sub || !sub.imageData || !sub.width || !sub.height) {
            return [];
        }

        const { width, height } = sub;
        const pixels = sub.imageData;
        const rowHasInk = new Array(height).fill(false);
        for (let y = 0; y < height; y++) {
            const rowStart = y * width * 4;
            for (let x = 0; x < width; x++) {
                if (pixels[rowStart + x * 4] < 128) { // R channel; ink pixels are pure black
                    rowHasInk[y] = true;
                    break;
                }
            }
        }

        let bands = this._detectLineBands(rowHasInk);
        if (bands.length === 0) return [];

        const scale = 3;
        const padding = 20;
        const vPad = 3; // small vertical margin around each cropped line, in source pixels

        return bands.map(([y0, y1]) => {
            const cropY0 = Math.max(0, y0 - vPad);
            const cropY1 = Math.min(height - 1, y1 + vPad);
            const cropHeight = cropY1 - cropY0 + 1;

            const rawCanvas = document.createElement('canvas');
            rawCanvas.width = width;
            rawCanvas.height = cropHeight;
            const rawCtx = rawCanvas.getContext('2d');
            const fullImageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
            // Draw the full image shifted up so the desired row range lands at y=0..cropHeight
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            tempCanvas.getContext('2d').putImageData(fullImageData, 0, 0);
            rawCtx.fillStyle = '#ffffff';
            rawCtx.fillRect(0, 0, width, cropHeight);
            rawCtx.drawImage(tempCanvas, 0, cropY0, width, cropHeight, 0, 0, width, cropHeight);

            const outCanvas = document.createElement('canvas');
            outCanvas.width = width * scale + padding * 2;
            outCanvas.height = cropHeight * scale + padding * 2;
            const outCtx = outCanvas.getContext('2d');
            outCtx.fillStyle = '#ffffff';
            outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = 'high';
            outCtx.drawImage(
                rawCanvas, 0, 0, width, cropHeight,
                padding, padding, width * scale, cropHeight * scale
            );
            return outCanvas;
        });
    },

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
