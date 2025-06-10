/**
 * Post-processing Module for RTL Languages.
 * Cleans and normalizes text extracted from Persian and Arabic documents.
 */
export const Postprocessor = {
    /**
     * Normalizes text by correcting common OCR errors for RTL scripts.
     * @param {string} text - The raw text from the OCR engine.
     * @returns {string} The cleaned and normalized text.
     */
    normalizeRTL(text) {
        if (!text) return '';

        // 1. Character Normalization (Arabic to Persian variants)
        text = text.replace(/ي/g, 'ی')
                   .replace(/ك/g, 'ک');

        // 2. Fix common OCR mistakes for Persian/Arabic
        text = text.replace(/ه /g, 'هٔ ');

        // 3. Normalize spacing around punctuation
        text = text.replace(/\s+([.,!?:;،؛؟])/g, '$1'); 
        text = text.replace(/([.,!?:;،؛؟])(\S)/g, '$1 $2');

        // 4. Trim whitespace from start, end, and remove multiple spaces
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    }
};
