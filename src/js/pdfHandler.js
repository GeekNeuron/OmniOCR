import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { Preprocessor } from './preprocessor.js';

export const PDFHandler = {
    /**
     * Processes a PDF file, performing OCR on each page.
     * @param {File} file - The PDF file to process.
     * @returns {Promise<string>} The concatenated text from all pages.
     */
    async process(file, worker) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error("PDF.js library is not loaded.");
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'src/js/libraries/pdf.worker.min.js';
        
        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
            fileReader.onload = async (event) => {
                try {
                    const typedarray = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = '';
                    const totalPages = pdf.numPages;

                    for (let i = 1; i <= totalPages; i++) {
                        const overallProgress = (i - 1) / totalPages;
                        UI.updateProgress(`Processing page ${i} of ${totalPages}...`, overallProgress);
                        
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.5 }); // Higher scale for better quality
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        
                        // Preprocess the canvas image of the page
                        const preprocessedCanvas = await Preprocessor.process(canvas);

                        const pageText = await OCR.recognize(preprocessedCanvas, worker);
                        fullText += pageText.trim() + '\n\n';
                        
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
