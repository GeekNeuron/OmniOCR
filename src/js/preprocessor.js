/**
 * Image Preprocessing Module.
 * Applies filters to an image to improve OCR accuracy.
 */
export const Preprocessor = {
    /**
     * Processes an image source (from a File or a Canvas) and returns a
     * preprocessed image data URL ready for OCR.
     * @param {File|HTMLCanvasElement} imageSource - The source image.
     * @returns {Promise<string>} A promise that resolves with the data URL of the preprocessed image.
     */
    process(imageSource) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;

                // 1. Draw the original image
                ctx.drawImage(image, 0, 0);

                // 2. Get image data to manipulate pixels
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // 3. Apply filters: Grayscale and Thresholding
                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale conversion (average method)
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;     // Red
                    data[i + 1] = avg; // Green
                    data[i + 2] = avg; // Blue
                }
                
                // Simple thresholding
                const threshold = 128; 
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = data[i]; // Since it's grayscale, R, G, and B are the same
                    const value = brightness > threshold ? 255 : 0;
                    data[i] = value;
                    data[i + 1] = value;
                    data[i + 2] = value;
                }
                
                // 4. Put the modified data back onto the canvas
                ctx.putImageData(imageData, 0, 0);

                // 5. Resolve with the new image data URL
                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = (err) => reject(new Error("Failed to load image for preprocessing."));

            // Handle both File objects and existing Canvas elements
            if (imageSource instanceof File) {
                // To prevent memory leaks, revoke the object URL after the image has loaded
                const url = URL.createObjectURL(imageSource);
                image.src = url;
                image.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
            } else if (imageSource instanceof HTMLCanvasElement) {
                image.src = imageSource.toDataURL();
            } else {
                 reject(new Error("Unsupported image source type for preprocessing."));
            }
        });
    }
};
