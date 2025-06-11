/**
 * Cloud OCR Module
 * Handles API calls to Google Cloud Vision AI.
 */
export const CloudOCR = {
    /**
     * Performs OCR using the Google Cloud Vision API.
     * @param {string} base64Image - The base64 encoded string of the image, without the data URI prefix.
     * @param {string} apiKey - The user's API key for the cloud service.
     * @returns {Promise<string>} A promise that resolves with the extracted text.
     */
    async recognize(base64Image, apiKey) {
        if (!apiKey) {
            throw new Error("API Key is required for Advanced Mode.");
        }

        const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        
        const requestBody = {
            requests: [
                {
                    image: {
                        content: base64Image,
                    },
                    features: [
                        {
                            type: "TEXT_DETECTION",
                        },
                    ],
                },
            ],
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || 'Unknown API error';
            throw new Error(`Cloud API Error: ${errorMessage}`);
        }

        const data = await response.json();
        
        const annotation = data.responses?.[0];
        if (annotation.fullTextAnnotation && annotation.fullTextAnnotation.text) {
            return annotation.fullTextAnnotation.text;
        } else if (annotation.error) {
            throw new Error(`Cloud API Error: ${annotation.error.message}`);
        } else {
            return ""; // No text found or empty annotation
        }
    }
};
