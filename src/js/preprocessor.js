/**
 * Advanced Image Preprocessing Module.
 * Applies a chain of filters to an image to maximize OCR accuracy,
 * with special handling for low-resolution subtitle images.
 */
export const Preprocessor = {
    /**
     * Processes an image source and returns a preprocessed image data URL.
     * @param {File|HTMLCanvasElement} imageSource - The source image.
     * @returns {Promise<string>} A promise that resolves with the data URL of the preprocessed image.
     */
    process(imageSource) {
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
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // Using luminosity method for better perceived brightness
                    const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = luma;
                    data[i + 1] = luma;
                    data[i + 2] = luma;
                }
                ctx.putImageData(imageData, 0, 0);

                // Step 3: Adaptive Thresholding (Otsu's Method) for dynamic contrast
                const threshold = this.otsuThreshold(imageData);
                for (let i = 0; i < data.length; i += 4) {
                    const value = data[i] > threshold ? 255 : 0;
                    data[i] = value;
                    data[i + 1] = value;
                    data[i + 2] = value;
                }
                ctx.putImageData(imageData, 0, 0);

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
     * Calculates the optimal threshold for a grayscale image using Otsu's method.
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
