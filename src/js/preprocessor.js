/**
 * Advanced Image Preprocessing Module.
 * Applies a chain of filters to an image to maximize OCR accuracy,
 * with special handling for low-resolution subtitle images.
 */
export const Preprocessor = {
    /**
     * Processes an image source and returns a preprocessed image data URL.
     * @param {File|HTMLCanvasElement} imageSource - The source image.
     * @param {object} [options] - Optional settings.
     * @param {boolean} [options.binarize=true] - Whether to apply hard Otsu black/white
     *   thresholding after grayscale conversion. Good for clean, high-contrast scans;
     *   can hurt accuracy on photos, colored/gradient backgrounds, or scripts with fine
     *   detail (e.g. CJK) where forcing pure black/white loses information.
     * @param {boolean} [options.deskew=true] - Whether to detect and correct slight
     *   rotation (common in phone photos of documents, or skewed scans) before OCR.
     * @returns {Promise<string>} A promise that resolves with the data URL of the preprocessed image.
     */
    process(imageSource, options = {}) {
        const { binarize = true, deskew = true } = options;
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');

                // Step 1: Upscale small images (like subtitles) for better processing
                const scaleFactor = (image.width < 300) ? 3 : 1.5;
                canvas.width = image.width * scaleFactor;
                canvas.height = image.height * scaleFactor;

                // Disable image smoothing to keep pixels sharp during scaling
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                // Step 2: Grayscale Conversion
                let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // Using luminosity method for better perceived brightness
                    const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = luma;
                    data[i + 1] = luma;
                    data[i + 2] = luma;
                }
                ctx.putImageData(imageData, 0, 0);

                // Step 3: Deskew - detect and correct slight rotation before thresholding
                if (deskew) {
                    const angle = this.detectSkewAngle(imageData, canvas.width, canvas.height);
                    if (Math.abs(angle) > 0.3) {
                        const rad = angle * Math.PI / 180;
                        const w = canvas.width, h = canvas.height;
                        const newW = Math.ceil(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad)));
                        const newH = Math.ceil(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad)));

                        const rotatedCanvas = document.createElement('canvas');
                        rotatedCanvas.width = newW;
                        rotatedCanvas.height = newH;
                        const rctx = rotatedCanvas.getContext('2d');
                        rctx.fillStyle = '#ffffff';
                        rctx.fillRect(0, 0, newW, newH);
                        rctx.translate(newW / 2, newH / 2);
                        rctx.rotate(rad);
                        rctx.drawImage(canvas, -w / 2, -h / 2);

                        canvas = rotatedCanvas;
                        ctx = rctx;
                        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        data = imageData.data;
                    }
                }

                // Step 4: Adaptive (local) thresholding - optional. Unlike a single global
                // threshold (Otsu), this compares each pixel to the mean of its own local
                // neighborhood, so it handles uneven lighting/shadows across a photographed
                // page far better (a global threshold can wash out or blacken whole regions
                // under a shadow or glare).
                if (binarize) {
                    const binary = this.adaptiveThreshold(imageData, canvas.width, canvas.height);
                    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
                        data[i] = data[i + 1] = data[i + 2] = binary[p];
                    }
                    ctx.putImageData(imageData, 0, 0);
                }

                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = (err) => reject(new Error("Failed to load image for preprocessing."));

            if (imageSource instanceof File) {
                const url = URL.createObjectURL(imageSource);
                image.src = url;
                image.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
            } else if (imageSource instanceof HTMLCanvasElement) {
                image.src = imageSource.toDataURL();
            } else {
                reject(new Error("Unsupported image source type."));
            }
        });
    },

    /**
     * Detects the rotation angle (in degrees) of text in a grayscale image using a
     * projection-profile method: for each candidate angle, dark pixels are projected
     * onto an axis perpendicular to that angle and bucketed; the angle whose buckets
     * have the highest variance is the one where horizontal text lines line up most
     * sharply (correctly deskewed text produces tight, high-contrast row bands).
     * @param {ImageData} grayImageData - Grayscale image data.
     * @param {number} width
     * @param {number} height
     * @returns {number} The detected skew angle in degrees (positive = clockwise).
     */
    detectSkewAngle(grayImageData, width, height) {
        const data = grayImageData.data;

        // Sample dark pixels from a downscaled copy - angle detection doesn't need
        // full resolution, and this keeps the search fast regardless of image size.
        const maxDim = 300;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        const sw = Math.max(1, Math.round(width * scale));
        const sh = Math.max(1, Math.round(height * scale));

        const darkPoints = [];
        for (let sy = 0; sy < sh; sy++) {
            const y = Math.min(height - 1, Math.round(sy / scale));
            for (let sx = 0; sx < sw; sx++) {
                const x = Math.min(width - 1, Math.round(sx / scale));
                if (data[(y * width + x) * 4] < 128) {
                    darkPoints.push(sx, sy);
                }
            }
        }

        // Not enough content (or a nearly blank image) to judge skew reliably
        if (darkPoints.length < 40) return 0;

        // Real text pages have sparse dark ink on a light background. If a large share
        // of the sampled image is dark, it's more likely a shadow, gradient, or photo -
        // content the projection-profile method can easily mistake for text-line skew
        // (e.g. a shadow's boundary can look like a strong "line" at the wrong angle).
        const darkRatio = (darkPoints.length / 2) / (sw * sh);
        if (darkRatio > 0.25) return 0;

        const scoreAngle = (angleDeg) => {
            const rad = angleDeg * Math.PI / 180;
            const sin = Math.sin(rad), cos = Math.cos(rad);
            const buckets = new Map();
            for (let i = 0; i < darkPoints.length; i += 2) {
                const proj = Math.round(darkPoints[i] * sin + darkPoints[i + 1] * cos);
                buckets.set(proj, (buckets.get(proj) || 0) + 1);
            }
            const counts = Array.from(buckets.values());
            const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
            return counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length;
        };

        // Coarse search across a realistic range for scanned/photographed documents
        let bestAngle = 0, bestScore = -Infinity;
        for (let a = -15; a <= 15; a += 1) {
            const score = scoreAngle(a);
            if (score > bestScore) { bestScore = score; bestAngle = a; }
        }
        // Refine around the coarse best angle
        let refinedAngle = bestAngle, refinedScore = bestScore;
        for (let a = bestAngle - 1; a <= bestAngle + 1; a += 0.1) {
            const score = scoreAngle(a);
            if (score > refinedScore) { refinedScore = score; refinedAngle = a; }
        }
        return Math.round(refinedAngle * 10) / 10;
    },

    /**
     * Binarizes a grayscale image using local adaptive thresholding (Bradley's method):
     * each pixel is compared against the mean brightness of its own local window rather
     * than a single global threshold, so uneven lighting/shadows across the image don't
     * wash out or blacken whole regions. Uses an integral image so the local mean for
     * every pixel is computed in O(1), keeping the whole pass O(width*height).
     * @param {ImageData} imageData - The grayscale image data.
     * @param {number} width
     * @param {number} height
     * @returns {Uint8ClampedArray} One byte per pixel: 0 (ink) or 255 (background).
     */
    adaptiveThreshold(imageData, width, height) {
        const data = imageData.data;

        // Build a summed-area (integral) table of grayscale values, padded by one
        // row/column of zeros so range-sum lookups don't need edge-case branching.
        const stride = width + 1;
        const integral = new Float64Array(stride * (height + 1));
        for (let y = 0; y < height; y++) {
            let rowSum = 0;
            for (let x = 0; x < width; x++) {
                rowSum += data[(y * width + x) * 4];
                integral[(y + 1) * stride + (x + 1)] = integral[y * stride + (x + 1)] + rowSum;
            }
        }

        const windowSize = Math.max(15, Math.floor(Math.min(width, height) / 8));
        const half = Math.floor(windowSize / 2);
        const sensitivity = 0.15; // a pixel must be at least 15% darker than its local mean to count as ink

        const output = new Uint8ClampedArray(width * height);
        for (let y = 0; y < height; y++) {
            const y0 = Math.max(0, y - half);
            const y1 = Math.min(height - 1, y + half);
            for (let x = 0; x < width; x++) {
                const x0 = Math.max(0, x - half);
                const x1 = Math.min(width - 1, x + half);
                const count = (x1 - x0 + 1) * (y1 - y0 + 1);
                const sum = integral[(y1 + 1) * stride + (x1 + 1)]
                          - integral[y0 * stride + (x1 + 1)]
                          - integral[(y1 + 1) * stride + x0]
                          + integral[y0 * stride + x0];
                const localMean = sum / count;
                const pixelValue = data[(y * width + x) * 4];
                output[y * width + x] = pixelValue < localMean * (1 - sensitivity) ? 0 : 255;
            }
        }
        return output;
    },

    /**
     * Calculates the optimal threshold for a grayscale image using Otsu's method.
     * Kept as a utility (no longer used by the default binarize step, which now uses
     * adaptiveThreshold above for better handling of uneven lighting).
     * @param {ImageData} imageData - The grayscale image data.
     * @returns {number} The calculated threshold value.
     */
    otsuThreshold(imageData) {
        const data = imageData.data;
        const histData = new Array(256).fill(0);

        for (let i = 0; i < data.length; i += 4) {
            histData[data[i]]++;
        }

        const total = imageData.width * imageData.height;
        let sum = 0;
        for (let i = 1; i < 256; ++i) {
            sum += i * histData[i];
        }

        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let varMax = 0;
        let threshold = 0;

        for (let t = 0; t < 256; ++t) {
            wB += histData[t];
            if (wB === 0) continue;
            wF = total - wB;
            if (wF === 0) break;

            sumB += t * histData[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * (mB - mF) ** 2;

            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        return threshold;
    }
};
