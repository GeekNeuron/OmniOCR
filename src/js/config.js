/**
 * Application Configuration
 * Contains settings like character whitelists for different languages.
 */
export const AppConfig = {
    // Whitelists constrain the OCR engine to a specific set of characters.
    whitelists: {
        eng: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:;'\"()[]{}-–—_=+*&^%$#@~`\\ \n",
        
        // Persian whitelist: Includes all unique Persian characters and standard numerals.
        // \u200c (ZWNJ) lets Tesseract's own model output نیم‌فاصله directly, in addition
        // to our own postprocessor correction. … and ♪ are common in subtitle dialogue
        // (trailing sentences) and song-lyric lines.
        fas: "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیآءأؤإئ۱۲۳۴۵۶۷۸۹۰.,!?:;،؛؟()[]{}-–—_\u200c…♪ \n",
        
        // Arabic whitelist: Includes Arabic-specific characters like ة and ى.
        ara: "ابتثجحخدذرزسشصضطظعغفقكلمنوهيآأؤإئءةى٠١٢٣٤٥٦٧٨٩.,!?:;،؛؟()[]{}-–—_…♪ \n"
    },

    /**
     * Combines whitelists for multi-language OCR.
     * IMPORTANT: A whitelist is only returned if EVERY requested language has an
     * explicitly defined whitelist. If any language in the combination (e.g. 'deu',
     * 'fra', 'chi_sim') has no whitelist entry, we must NOT apply a partial
     * whitelist built only from the languages we do recognize (typically 'eng') -
     * doing so would silently strip that language's own characters (ä/ö/ü, é/à/ç,
     * CJK glyphs, etc.) from every OCR result. Returning '' leaves Tesseract's
     * built-in character set for that language untouched.
     * @param {string[]} langs - An array of language codes (e.g., ['fas', 'eng']).
     * @returns {string} A combined whitelist string, or '' if any language lacks one.
     */
    getCombinedWhitelist(langs) {
        const allDefined = langs.every(lang => Boolean(this.whitelists[lang]));
        if (!allDefined) {
            return '';
        }

        const combinedChars = new Set();
        langs.forEach(lang => {
            for (const char of this.whitelists[lang]) {
                combinedChars.add(char);
            }
        });
        return Array.from(combinedChars).join('');
    }
};
