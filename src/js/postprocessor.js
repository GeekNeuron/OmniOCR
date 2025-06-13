import { Dictionary } from './dictionary.js';

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

            // Advanced Zero-Width Non-Joiner (نیم‌فاصله) logic using the dictionary
            const words = cleanedText.split(/(\s+)/); // Split by spaces but keep them
            const suffixes = ['ها', 'های', 'ام', 'ای', 'ات', 'اش'];
            
            const processedWords = words.map(word => {
                // Find the longest possible suffix that matches
                for (const suffix of suffixes) {
                    if (word.endsWith(suffix)) {
                        const root = word.slice(0, -suffix.length);
                        // Check if the root word exists in our dictionary
                        if (Dictionary.has(root)) {
                            return `${root}\u200c${suffix}`; // Add ZWNJ
                        }
                    }
                }
                return word; // Return the word as is if no match is found
            });
            cleanedText = processedWords.join('');
        }
        
        // --- Step 2: Universal Spacing and Punctuation Cleanup ---
        
        // Normalize spacing around punctuation
        cleanedText = cleanedText.replace(/\s+([.,!?:;،؛؟])/g, '$1'); 
        cleanedText = cleanedText.replace(/([.,!?:;،؛؟])([^\s.,!?:;،؛؟])/g, '$1 $2');
        
        // --- Step 3: Universal Whitespace Cleanup ---
        
        // Replace multiple newlines with a single one
        cleanedText = cleanedText.replace(/(\n\s*){2,}/g, '\n\n');
        
        // Replace multiple spaces with a single space
        cleanedText = cleanedText.replace(/ +/g, ' ');

        return cleanedText.trim();
    }
};
