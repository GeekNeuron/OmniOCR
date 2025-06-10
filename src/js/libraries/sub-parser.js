
/**
 * .sub (VobSub) File Parser Module (Experimental)
 * Reads a binary .sub file buffer and extracts subtitle images at given offsets.
 * NOTE: This is a simplified implementation and may not support all .sub file variations.
 */
export const SUBParser = {
    /**
     * Extracts and renders a single subtitle image from the .sub buffer at a specific offset.
     * @param {ArrayBuffer} subBuffer - The entire buffer of the .sub file.
     * @param {number} offset - The file position (from .idx) where the subtitle packet begins.
     * @returns {HTMLCanvasElement | null} A canvas containing the rendered subtitle image, or null on failure.
     */
    renderImageAt(subBuffer, offset) {
        try {
            const view = new DataView(subBuffer);

            // Find the control sequence to get image dimensions and data offset.
            // This sequence typically follows the main packet header.
            let controlSequenceOffset = -1;
            for (let i = offset; i < Math.min(offset + 100, view.byteLength - 4); i++) {
                if (view.getUint16(i) === 0 && view.getUint16(i + 2) === 1) { // Look for start of SPU control block
                    controlSequenceOffset = i;
                    break;
                }
            }

            if (controlSequenceOffset === -1) {
                console.warn(`No valid SPU control sequence found at offset: ${offset}`);
                return null;
            }

            const dataSize = view.getUint16(controlSequenceOffset - 2);
            const rleDataOffset = view.getUint16(controlSequenceOffset + 4);

            // Extract image dimensions from the control sequence
            const width = view.getUint16(controlSequenceOffset + 8);
            const height = view.getUint16(controlSequenceOffset + 10);
            
            if (width === 0 || height === 0 || width > 1000 || height > 500) {
                console.warn(`Invalid dimensions (${width}x${height}) found at offset: ${offset}`);
                return null;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // Fill with a black background for better contrast, which helps OCR
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);
            
            const imageData = ctx.getImageData(0, 0, width, height);
            const pixelData = imageData.data;

            // Simplified palette (can be customized in .idx, but we use a default)
            const palette = [
                [0, 0, 0, 0],           // 0: Transparent
                [230, 230, 230, 255],   // 1: Primary color (e.g., white/light gray)
                [80, 80, 80, 255],      // 2: Secondary color (e.g., outline)
                [10, 10, 10, 255]       // 3: Background color (e.g., outline)
            ];

            this.decodeRLE(view, controlSequenceOffset + rleDataOffset, dataSize, width, height, pixelData, palette);

            ctx.putImageData(imageData, 0, 0);
            return canvas;

        } catch (e) {
            console.error(`Error parsing subtitle packet at offset ${offset}:`, e);
            return null;
        }
    },
    
    /**
     * Decodes the Run-Length Encoded pixel data onto the canvas.
     * This is a critical and complex part of parsing VobSub data.
     */
    decodeRLE(view, start, size, width, height, pixelData, palette) {
        let x = 0, y = 0;
        let offset = start;
        const end = start + size;

        while (offset < end && y < height) {
            const byte = view.getUint8(offset++);
            
            if (byte === 0) {
                // This is a special code, often indicating end of RLE for a line, or padding.
                // If the next byte is also 0, it means end of line.
                if (offset < end && view.getUint8(offset) === 0) {
                    offset++;
                    x = 0;
                    y++;
                }
                continue;
            }

            const runLength = byte >> 2;
            const colorIndex = byte & 0x03;
            const color = palette[colorIndex];

            for (let i = 0; i < runLength; i++) {
                if (x >= width) {
                    x = 0;
                    y++;
                    if (y >= height) break;
                }
                
                const pxIdx = (y * width + x) * 4;
                if (color[3] > 0) { // Only draw non-transparent pixels
                    pixelData[pxIdx] = color[0];     // R
                    pixelData[pxIdx + 1] = color[1]; // G
                    pixelData[pxIdx + 2] = color[2]; // B
                    pixelData[pxIdx + 3] = color[3]; // A
                }
                x++;
            }
        }
    }
};
