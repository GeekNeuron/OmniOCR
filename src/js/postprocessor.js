/**
 * Post-processing Module.
 * Cleans and normalizes text extracted from the OCR engine.
 */
export const Postprocessor = {
    /**
     * Cleans the OCR output text based on the detected language.
     * @param {string} text - The raw text from the OCR engine.
     * @param {string} lang - The language code used for OCR.
     * @returns {string} The cleaned and normalized text.
     */
    cleanup(text, lang) {
        if (!text) return '';

        let cleanedText = text;

        // --- Step 1: Language-specific normalization (RTL) ---
        if (lang === 'fas' || lang === 'ara') {
            cleanedText = cleanedText.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
            cleanedText = cleanedText.replace(/ه /g, 'هٔ ');
        }
        
        // --- Step 2: Universal Spacing and Punctuation Cleanup ---
        cleanedText = cleanedText.replace(/\s+([.,!?:;،؛؟])/g, '$1'); 
        cleanedText = cleanedText.replace(/([.,!?:;،؛؟])([^\s.,!?:;،؛؟])/g, '$1 $2');
        
        // --- Step 3: Subtitle-specific Cleanup ---
        // Remove common dialogue markers like "-" at the beginning of lines
        cleanedText = cleanedText.replace(/^- /gm, '');

        // --- Step 4: Universal Whitespace Cleanup ---
        cleanedText = cleanedText.replace(/(\n\s*){2,}/g, '\n\n');
        cleanedText = cleanedText.replace(/ +/g, ' ');

        return cleanedText.trim();
    }
};
