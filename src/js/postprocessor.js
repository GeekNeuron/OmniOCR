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
        if (lang === 'fas') {
            // Normalize Arabic characters to their Persian counterparts
            cleanedText = cleanedText.replace(/ي/g, 'ی').replace(/ك/g, 'ک');

            // ** NEW LOGIC: Add Zero-Width Non-Joiner (نیم‌فاصله) for compound words **
            // Handles common suffixes like ها, های, ام, ای, ات, اش
            const zwnjPatterns = [
                /(\S+)(ها)\b/g,   // for words ending in ها (e.g., کتابها -> کتاب‌ها)
                /(\S+)(های)\b/g,  // for words ending in های (e.g., کتابهای -> کتاب‌های)
                /(\S+)(ام)\b/g,   // for words ending in ام (e.g., کتابم -> کتاب‌ام)
                /(\S+)(ای)\b/g,   // for words ending in ای (e.g., نامه\u200cای -> نامه‌ای)
                /(\S+)(ات)\b/g,   // for words ending in ات (e.g., اطلاعات -> اطلاعات)
                /(\S+)(اش)\b/g,   // for words ending in اش (e.g., کتابش -> کتاب‌اش)
            ];

            zwnjPatterns.forEach(pattern => {
                cleanedText = cleanedText.replace(pattern, '$1\u200c$2');
            });
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
