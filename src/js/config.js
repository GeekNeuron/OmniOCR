/**
 * Application Configuration
 * Contains settings like character whitelists for different languages.
 */
export const AppConfig = {
    // Whitelists constrain the OCR engine to a specific set of characters.
    whitelists: {
        eng: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:;'\"()[]{}-–—_=+*&^%$#@~`\\ \n",
        
        // Persian whitelist: Includes all unique Persian characters and standard numerals.
        fas: "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیآءأؤإئ۱۲۳۴۵۶۷۸۹۰.,!?:;،؛؟()[]{}-–—_ \n",
        
        // Arabic whitelist: Includes Arabic-specific characters like ة and ى.
        ara: "ابتثجحخدذرزسشصضطظعغفقكلمنوهيآأؤإئءةى٠١٢٣٤٥٦٧٨٩.,!?:;،؛؟()[]{}-–—_ \n"
    },

    /**
     * Combines whitelists for multi-language OCR.
     * @param {string[]} langs - An array of language codes (e.g., ['fas', 'eng']).
     * @returns {string} A single string containing all unique characters from the specified whitelists.
     */
    getCombinedWhitelist(langs) {
        const combinedChars = new Set();
        langs.forEach(lang => {
            const list = this.whitelists[lang] || '';
            for (const char of list) {
                combinedChars.add(char);
            }
        });
        return Array.from(combinedChars).join('');
    }
};
