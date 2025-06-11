/**
 * Cloud API Handlers
 * A collection of modules to interact with various cloud services for advanced OCR processing.
 */

// --- Cloudinary Handler for Image Preprocessing ---
const CloudinaryHandler = {
    async enhanceImage(file, cloudName, uploadPreset = 'ml_default') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        // Apply transformations for better OCR results
        formData.append('transformation', 'e_improve,w_2000,h_2000,c_limit/e_sharpen');

        const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload and enhance image with Cloudinary.');
        }

        const data = await response.json();
        return data.secure_url; // Return the URL of the enhanced image
    }
};

// --- Google Vision Handler for Core OCR ---
const GoogleVisionOCR = {
    async recognizeFromUrl(imageUrl, apiKey) {
        const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        const requestBody = {
            requests: [{
                image: { source: { imageUri: imageUrl } },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            }],
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google Vision API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const annotation = data.responses?.[0];
        return annotation?.fullTextAnnotation?.text || "";
    }
};

// --- Hugging Face Handler for Text Post-processing ---
const HuggingFaceCorrector = {
    async correctGrammar(text, apiKey) {
        // Using a popular grammar correction model
        const model = 'grammarly/coedit-large';
        const endpoint = `https://api-inference.huggingface.co/models/${model}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: `fix grammar: ${text}` }),
        });

        if (!response.ok) {
            console.warn('Hugging Face API failed, returning original text.');
            return text; // Return original text if correction fails
        }
        
        const data = await response.json();
        return data[0]?.generated_text || text;
    }
};

export const API = {
    Cloudinary: CloudinaryHandler,
    Google: GoogleVisionOCR,
    HuggingFace: HuggingFaceCorrector,
};
