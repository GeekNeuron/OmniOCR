/**
 * Application Configuration
 * Contains settings like character whitelists for different languages.
 */
export const AppConfig = {
    // Whitelists constrain the OCR engine to a specific set of characters.
    // This is highly effective for improving accuracy in scripts like Persian and Arabic.
    whitelists: {
        eng: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:;'\"()[]{}-–—_=+*&^%$#@~`\\ \n",
        
        // Persian whitelist: Includes all unique Persian characters and standard numerals.
        fas: "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیآءأؤإئ۱۲۳۴۵۶۷۸۹۰.,!?:;،؛؟()[]{}-–—_ \n",
        
        // Arabic whitelist: Includes Arabic-specific characters like ة and ى.
        ara: "ابتثجحخدذرزسشصضطظعغفقكلمنوهيآأؤإئءةى٠١٢٣٤٥٦٧٨٩.,!?:;،؛؟()[]{}-–—_ \n"
    }
};
