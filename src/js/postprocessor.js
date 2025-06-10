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

        // --- Step 1: Language-specific normalization (currently for RTL) ---
        if (lang === 'fas' || lang === 'ara') {
            // Normalize Arabic characters to their Persian counterparts
            cleanedText = cleanedText.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
            
            // Fix common "he" spacing issue
            cleanedText = cleanedText.replace(/ه /g, 'هٔ ');
        }
        
        // --- Step 2: Universal Spacing and Punctuation Cleanup ---
        
        // Normalize spacing around punctuation for all languages
        // Removes space before punctuation and ensures one space after.
        cleanedText = cleanedText.replace(/\s+([.,!?:;،؛؟])/g, '$1'); 
        cleanedText = cleanedText.replace(/([.,!?:;،؛؟])([^\s.,!?:;،؛؟])/g, '$1 $2');
        
        // --- Step 3: Universal Whitespace Cleanup ---
        
        // Replace multiple newlines with a single one to avoid large empty gaps
        cleanedText = cleanedText.replace(/(\n\s*){2,}/g, '\n\n');
        
        // Replace multiple spaces with a single space
        cleanedText = cleanedText.replace(/ +/g, ' ');

        return cleanedText.trim();
    }
};
