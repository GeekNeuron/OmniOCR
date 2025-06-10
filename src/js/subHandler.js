import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { Preprocessor } from './preprocessor.js'; // Using the advanced preprocessor

/**
 * Experimental handler for VobSub (.sub) files.
 * Parses the binary file to extract individual subtitle images for OCR.
 */
export const SUBHandler = {
    /**
     * Processes a .sub file, preprocesses each image, and sends it to the OCR engine.
     * @param {File} file - The .sub file to process.
     * @returns {Promise<string>} A promise that resolves with the concatenated text.
     */
    process(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const buffer = event.target.result;
                    const packets = this.findAllPackets(buffer);

                    if (packets.length === 0) {
                        throw new Error("No valid subtitle packets found in the .sub file.");
                    }

                    let fullText = '';
                    for (let i = 0; i < packets.length; i++) {
                        UI.updateProgress(`Processing subtitle image ${i + 1} of ${packets.length}...`, i / packets.length);

                        const canvas = this.renderPacketToCanvas(packets[i]);
                        if (canvas) {
                            // The key step: Use the advanced preprocessor on the extracted image
                            const preprocessedImage = await Preprocessor.process(canvas);
                            const pageText = await OCR.recognize(preprocessedImage);
                            if (pageText && pageText.trim()) {
                                fullText += pageText.trim() + '\n';
                            }
                        }
                    }
                    resolve(fullText.trim());
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read .sub file."));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Finds all VobSub packets in a buffer.
     * @param {ArrayBuffer} buffer - The file buffer.
     * @returns {Array<ArrayBuffer>} An array of packet buffers.
     */
    findAllPackets(buffer) {
        const view = new DataView(buffer);
        const packetHeader = 0x5350; // "SP"
        const packets = [];
        let offset = 0;

        while (offset < buffer.byteLength) {
            const index = this.indexOf(buffer, packetHeader, offset);
            if (index === -1) break;
            
            const nextIndex = this.indexOf(buffer, packetHeader, index + 2);
            const end = (nextIndex !== -1) ? nextIndex : buffer.byteLength;
            packets.push(buffer.slice(index, end));
            offset = index + 2;
        }
        return packets;
    },
    
    /**
     * Finds the index of a 16-bit header in a buffer.
     */
    indexOf(buffer, header, startOffset) {
        const view = new DataView(buffer);
        for (let i = startOffset; i < buffer.byteLength - 1; i++) {
            if (view.getUint16(i, true) === header) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Renders a single packet to a canvas.
     * This is a simplified RLE decoder.
     */
    renderPacketToCanvas(packetBuffer) {
        const view = new DataView(packetBuffer);
        // Find dimensions in the control sequence
        let width = 720, height = 40; // Default fallback
        for (let i = 0; i < Math.min(view.byteLength - 12, 100); i++) {
            if (view.getUint16(i, false) === 0x0000 && view.getUint16(i + 2, false) === 0x0001) {
                width = view.getUint16(i + 8, false);
                height = view.getUint16(i + 10, false);
                break;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        // Fill with black background to improve contrast for white/gray text
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const palette = [[0, 0, 0, 0], [240, 240, 240, 255], [80, 80, 80, 255], [10, 10, 10, 255]];

        let x = 0, y = 0;
        let offset = 20; // A common starting offset for data
        while (offset < view.byteLength && y < height) {
            const byte1 = view.getUint8(offset++);
            const byte2 = view.getUint8(offset++);
            
            const processNibble = (nibble) => {
                let runLength, colorIndex;
                if (nibble >= 0xc) { runLength = (nibble << 12 >> 12) * 256 * 256; colorIndex = 0; }
                else if (nibble >= 0x8) { runLength = (nibble << 12 >> 12) * 256; colorIndex = 0; }
                else if (nibble >= 0x4) { runLength = (nibble << 12 >> 12); colorIndex = 0; }
                else { runLength = 1; colorIndex = nibble; }

                for (let k = 0; k < runLength; k++) {
                    if (x >= width) { x = 0; y++; }
                    if (y >= height) return;
                    
                    const pIdx = (y * width + x) * 4;
                    const color = palette[colorIndex];
                    if (color[3] > 0) { // Only draw non-transparent pixels
                        data[pIdx] = color[0]; data[pIdx + 1] = color[1]; data[pIdx + 2] = color[2]; data[pIdx + 3] = color[3];
                    }
                    x++;
                }
            };
            
            processNibble(byte1 >> 4);
            processNibble(byte1 & 0x0F);
            processNibble(byte2 >> 4);
            processNibble(byte2 & 0x0F);
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
};
