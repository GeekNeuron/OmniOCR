/**
 * Cloud API Handlers
 * A collection of modules to interact with various cloud services for advanced OCR processing.
 */

// --- Cloudinary Handler for Image Preprocessing ---
const CloudinaryHandler = {
    async enhanceImage(file, cloudName, uploadPreset = 'ml_default') {
        // If credentials aren't provided, skip this step.
        if (!cloudName) {
            console.warn("Cloudinary Cloud Name not provided. Skipping enhancement.");
            return null; // Return null to indicate no enhancement was done
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        // Apply transformations for better OCR results:
        // e_improve: improve color, contrast, and brightness
        // w_2000,h_2000,c_limit: resize image to a max of 2000x2000, keeping aspect ratio
        // e_sharpen: sharpen the image
        formData.append('transformation', 'e_improve:50,w_2000,h_2000,c_limit/e_sharpen:40');

        const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            console.error('Cloudinary API Error:', await response.text());
            throw new Error('Failed to upload and enhance image with Cloudinary.');
        }

        const data = await response.json();
        return data.secure_url; // Return the URL of the enhanced image
    }
};

// --- Google Vision Handler for Core OCR ---
const GoogleVisionOCR = {
    async recognize(source, apiKey) {
        const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        
        let imageRequest;
        // Check if the source is a URL (from Cloudinary) or a base64 string
        if (typeof source === 'string' && source.startsWith('http')) {
            imageRequest = { source: { imageUri: source } };
        } else {
            imageRequest = { content: source };
        }

        const requestBody = {
            requests: [{
                image: imageRequest,
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }], // Best for dense text
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
        if (annotation.error) {
             throw new Error(`Cloud API returned an error: ${annotation.error.message}`);
        }
        return annotation?.fullTextAnnotation?.text || "";
    }
};

// --- Hugging Face Handler for Text Post-processing ---
const HuggingFaceCorrector = {
    async correctGrammar(text, apiKey) {
        // If no token is provided, skip this step.
        if (!apiKey) {
            console.warn("Hugging Face token not provided. Skipping grammar correction.");
            return text;
        }
        // Using a popular grammar correction model
        const model = 'grammarly/coedit-large';
        const endpoint = `https://api-inference.huggingface.co/models/${model}`;
        
        try {
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
        } catch (error) {
            console.warn('Error connecting to Hugging Face API, returning original text.', error);
            return text;
        }
    }
};

export const API = {
    Cloudinary: CloudinaryHandler,
    Google: GoogleVisionOCR,
    HuggingFace: HuggingFaceCorrector,
};
