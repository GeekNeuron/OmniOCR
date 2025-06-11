/**
 * Cloud OCR Module
 * Handles API calls to a cloud-based OCR service (e.g., Google Cloud Vision AI).
 */
export const CloudOCR = {
    /**
     * Performs OCR using a cloud API.
     * @param {string} base64Image - The base64 encoded string of the image.
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
            throw new Error(`Cloud API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        const annotation = data.responses?.[0];
        if (annotation.fullTextAnnotation) {
            return annotation.fullTextAnnotation.text;
        } else if (annotation.error) {
            throw new Error(`Cloud API returned an error: ${annotation.error.message}`);
        } else {
            return ""; // No text found
        }
    }
};
