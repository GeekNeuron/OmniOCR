/**
 * Application Configuration
 * Contains settings like character whitelists for different languages.
 */
export const AppConfig = {
    // Whitelists constrain the OCR engine to a specific set of characters,
    // which is highly effective for alphabetic and abjad scripts.
    // It is not recommended for logographic languages like Chinese or Japanese.
    whitelists: {
        eng: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:;'\"()[]{}-–—_=+*&^%$#@~`\\ \n",
        fas: "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیآءأؤإئابة۰۱۲۳۴۵۶۷۸۹.,!?:;،؛؟()[]{}-–—_ \n",
        ara: "ابتثجحخدذرزسشصضطظعغفقكلمنوهيآأؤإئءةى٠١٢٣٤٥٦٧٨٩.,!?:;،؛؟()[]{}-–—_ \n"
    }
};
