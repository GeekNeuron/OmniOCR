import { UI } from './ui.js';
import { OCR } from './ocr.js';

export const PDFHandler = {
    /**
     * Processes a PDF file, performing OCR on each page.
     * @param {File} file - The PDF file to process.
     * @returns {Promise<string>} The concatenated text from all pages.
     */
    async process(file) {
        // Ensure the pdfjsLib is loaded
        if (typeof pdfjsLib === 'undefined') {
            throw new Error("PDF.js library is not loaded.");
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://mozilla.github.io/pdf.js/build/pdf.worker.js`;

        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
            fileReader.onload = async (event) => {
                try {
                    const typedarray = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        UI.updateProgress(`Processing page ${i} of ${pdf.numPages}...`, (i - 1) / pdf.numPages);
                        
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        
                        const pageText = await OCR.recognize(canvas);
                        fullText += pageText.trim() + '\n\n';
                        
                        // Clean up to save memory
                        page.cleanup();
                    }
                    resolve(fullText.trim());
                } catch (error) {
                    reject(error);
                }
            };
            fileReader.onerror = (e) => reject(new Error("Error reading PDF file."));
            fileReader.readAsArrayBuffer(file);
        });
    }
};
