import { Dictionary, MiPrefixExceptions } from './dictionary.js';

// Common Persian words where a hamza (ء) is frequently dropped or misplaced -
// adapted from the khoshnevis project's correction list.
const HamzeFixes = {
    'ارایه': 'ارائه', 'سیو': 'سئو', 'مسیله': 'مسئله', 'مسیولیت': 'مسئولیت',
    'مسایل': 'مسائل', 'ریوف': 'رئوف', 'مسیول': 'مسئول', 'زیوس': 'زئوس',
    'کاکایو': 'کاکائو', 'ناپلیون': 'ناپلئون', 'نیون': 'نئون', 'کلیوپاترا': 'کلئوپاترا',
    'ژیوفیزیک': 'ژئوفیزیک', 'تیودور': 'تئودور', 'مصایب': 'مصائب', 'قایل': 'قائل',
    'ایتلاف': 'ائتلاف', 'هییت': 'هیئت', 'تیاتر': 'تئاتر', 'توطیه': 'توطئه',
    'جریت': 'جرئت', 'قرایت': 'قرائت', 'دنایت': 'دنائت', 'ژوین': 'ژوئن',
    'پنگوین': 'پنگوئن', 'رسایل': 'رسائل', 'علایم': 'علائم', 'ملایک': 'ملائک',
    'نویل': 'نوئل', 'سوید': 'سوئد',
};

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

            // Whole-word hamza corrections (ارایه -> ارائه, etc.)
            cleanedText = cleanedText.replace(/[\u0600-\u06FF]+/g, w => HamzeFixes[w] || w);

            const words = cleanedText.split(/(\s+)/); // Split by spaces but keep them
            const suffixes = ['های', 'ها', 'ترین', 'تر', 'ام', 'ای', 'ات', 'اش'];

            const processedWords = words.map(word => {
                if (word.includes('\u200c')) return word; // already has a ZWNJ, leave as-is

                // می‌/نمی‌ verb-prefix correction. This is the single most common ZWNJ
                // case in spoken dialogue/subtitles (میرم -> می‌رم, نمیدونم -> نمی‌دونم),
                // and unlike the suffix cases below it doesn't need a dictionary match -
                // "نمی" is essentially always the negative verb prefix. "می" alone is also
                // almost always the verb prefix, except for a short list of common nouns
                // (میدان, میوه, میلیون...) that we explicitly exclude.
                if (word.startsWith('نمی') && word.length > 4) {
                    return `نمی\u200c${word.slice(3)}`;
                }
                if (word.startsWith('می') && word.length > 3 && !MiPrefixExceptions.has(word)) {
                    return `می\u200c${word.slice(2)}`;
                }

                // Suffix correction: only applied when the root (word minus suffix) is a
                // known dictionary word, to avoid splitting ordinary words that happen to
                // end the same way (e.g. "دفتر" ending in "تر").
                for (const suffix of suffixes) {
                    if (word.endsWith(suffix)) {
                        const root = word.slice(0, -suffix.length);
                        if (Dictionary.has(root)) {
                            return `${root}\u200c${suffix}`;
                        }
                    }
                }
                return word; // Return the word as is if no rule matched
            });

            // Second pass: fix the complementary case, where OCR left a full space where a
            // half-space (ZWNJ) belongs - e.g. "کتاب ها" -> "کتاب‌ها" or "هیچ کس" -> "هیچ‌کس".
            // Only applied for a small list of known common compounds, or when the first word
            // is a known dictionary root, to avoid incorrectly joining unrelated adjacent words.
            const knownCompounds = [
                ['هیچ', 'کس'], ['هیچ', 'کسی'], ['هیچ', 'وقت'], ['هیچ', 'گاه'], ['هیچ', 'گاهی'],
                ['هیچ', 'جا'], ['هیچ', 'کدام'], ['هیچ', 'کدامی'], ['هیچ', 'جوری'], ['هیچ', 'گونه'],
                ['هم', 'چنین'], ['هم', 'اکنون'], ['هم', 'زمان'], ['هم', 'دیگر'], ['هم', 'کار'], ['هم', 'کلاسی'],
            ];
            const merged = [];
            for (let idx = 0; idx < processedWords.length; idx++) {
                const token = processedWords[idx];
                const prev = merged[merged.length - 1];
                const next = processedWords[idx + 1];
                if (/^\s+$/.test(token) && prev && next && !/^\s+$/.test(next)) {
                    const isKnownCompound = knownCompounds.some(([a, b]) => prev === a && next === b);
                    const isDictionarySuffix = suffixes.includes(next) && Dictionary.has(prev);
                    if (isKnownCompound || isDictionarySuffix) {
                        merged[merged.length - 1] = prev + '\u200c' + next;
                        idx++; // consume the next word token too, skipping past it
                        continue;
                    }
                }
                merged.push(token);
            }
            cleanedText = merged.join('');
        }
        
        // --- Step 2: Universal Spacing and Punctuation Cleanup ---

        // Strip invisible bidi direction marks (RLM U+200F, LRM U+200E) that Tesseract
        // sometimes emits around RTL text - harmless but pure clutter in an SRT file.
        cleanedText = cleanedText.replace(/[\u200e\u200f]/g, '');

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
