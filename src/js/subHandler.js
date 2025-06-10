import { UI } from './ui.js';
import { OCR } from './ocr.js';
import { Preprocessor } from './preprocessor.js';

/**
 * A more robust, heuristic-based handler for VobSub (.sub) files.
 * It scans for likely image data packets instead of relying on a fixed header.
 */
export const SUBHandler = {
    /**
     * Processes a .sub file by finding, rendering, and sending each subtitle image to the OCR engine.
     * @param {File} file - The .sub file to process.
     * @returns {Promise<string>} A promise that resolves with the concatenated text.
     */
    process(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const buffer = event.target.result;
                    const packets = this.findPacketsHeuristically(buffer);

                    if (packets.length === 0) {
                        throw new Error("No valid subtitle image data could be identified in the file. The format may be unsupported.");
                    }

                    let fullText = '';
                    for (let i = 0; i < packets.length; i++) {
                        UI.updateProgress(`Processing subtitle image ${i + 1} of ${packets.length}...`, i / packets.length);

                        const canvas = this.renderPacketToCanvas(packets[i]);
                        if (canvas) {
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
     * Scans the buffer for control sequences that define subtitle dimensions,
     * which is a more reliable way to find image packets.
     * @param {ArrayBuffer} buffer - The entire file buffer.
     * @returns {Array<ArrayBuffer>} An array of likely packet buffers.
     */
    findPacketsHeuristically(buffer) {
        const view = new DataView(buffer);
        const packets = [];
        const offsets = [];

        // The control sequence often starts with 0x00000001 after some padding.
        for (let i = 0; i < view.byteLength - 20; i++) {
            // Find the pattern: size_of_data (2 bytes), control_sequence_offset (2 bytes), 0x00, some_command, 0x06 (size)
            if (view.getUint8(i + 4) === 0x00 && view.getUint8(i + 6) === 0x06) {
                 // This pattern is often found near the start of a valid packet.
                 // We backtrack a bit to find the likely start of the MPEG packet.
                 // A common MPEG-PS packet starts with 0x000001BA or 0x000001BD
                 for (let j = i - 20; j < i; j++) {
                     if (view.getUint32(j) === 0x000001BA || view.getUint32(j) === 0x000001BD) {
                         if (!offsets.includes(j)) {
                             offsets.push(j);
                         }
                         break;
                     }
                 }
            }
        }
        
        if(offsets.length === 0) return [];

        // Create slices for each packet
        for (let i = 0; i < offsets.length; i++) {
            const start = offsets[i];
            const end = (i + 1 < offsets.length) ? offsets[i + 1] : buffer.byteLength;
            packets.push(buffer.slice(start, end));
        }
        
        return packets;
    },

    /**
     * Renders a single packet to a canvas using a simplified RLE decoder.
     */
    renderPacketToCanvas(packetBuffer) {
        const view = new DataView(packetBuffer);
        let width = 720, height = 50; // Default dimensions
        let dataOffset = -1;

        // Find control sequence to get dimensions and data offset
        for (let i = 0; i < Math.min(view.byteLength - 12, 150); i++) {
            if (view.getUint16(i) === 0x0000 && view.getUint16(i + 2) === 0x0001) {
                width = view.getUint16(i + 8);
                height = view.getUint16(i + 10);
                dataOffset = i + 12;
                break;
            }
        }

        if (dataOffset === -1 || width === 0 || height === 0) return null;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = 'black'; // Black background for better OCR contrast
        ctx.fillRect(0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixelData = imageData.data;
        const palette = [
            [0, 0, 0, 0], // 0: Transparent background
            [220, 220, 220, 255], // 1: A light gray/white for primary color
            [80, 80, 80, 255], // 2: A darker gray for anti-aliasing/border
            [10, 10, 10, 255]  // 3: A near-black for anti-aliasing/border
        ];

        let x = 0, y = 0;

        const decodeRLE = (offset) => {
            while (offset < view.byteLength - 1 && y < height) {
                const byte1 = view.getUint8(offset++);
                const byte2 = view.getUint8(offset++);

                const processNibble = (nibble) => {
                    let runLength, colorIndex;
                    if (nibble === 0) { // Potential end-of-line marker
                        return; // Continue to next nibble
                    } else if ((nibble & 0xC) === 0x4 || (nibble & 0xC) === 0x8) { // 01xx or 10xx
                         runLength = (nibble << 8 | view.getUint8(offset++)) & 0x3FFF;
                         colorIndex = 0;
                    } else if ((nibble & 0xC) === 0xC) { // 11xx
                        runLength = (nibble << 8 | view.getUint8(offset++)) & 0x3FFF;
                        colorIndex = view.getUint8(offset++) & 0x03;
                    } else { // 00xx
                        runLength = nibble & 0x03;
                        colorIndex = 0;
                    }
                    
                    for (let k = 0; k < runLength; k++) {
                        if (x >= width) { x = 0; y++; }
                        if (y >= height) return;
                        
                        const color = palette[colorIndex];
                        const pxIdx = (y * width + x) * 4;
                        if (color[3] > 0) {
                            pixelData[pxIdx] = color[0];     // R
                            pixelData[pxIdx + 1] = color[1]; // G
                            pixelData[pxIdx + 2] = color[2]; // B
                            pixelData[pxIdx + 3] = color[3]; // A
                        }
                        x++;
                    }
                };

                processNibble(byte1 >> 4);
                processNibble(byte1 & 0x0F);
                processNibble(byte2 >> 4);
                processNibble(byte2 & 0x0F);
            }
        };

        decodeRLE(dataOffset);

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
};
