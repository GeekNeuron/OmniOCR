/**
 * vobsub.js - A VobSub parser for the HTML5 platform.
 * Heavily modified and corrected for modern browsers and proper RLE decoding.
 */
var VobSub = (function() {
    'use strict';

    var VobSub = function(options) {
        this.subFile = options.subFile;
        this.idxFile = options.idxFile;
        this.onReady = options.onReady || function() {};
        this.onError = options.onError || function() {};
        this.times = [];
        this.palette = [];
        this.alpha = [0, 15, 15, 15]; // Default alpha: 0 is transparent
        this.size = { w: 0, h: 0 };
    };

    VobSub.prototype = {
        init: function() {
            this._parseIdx()
                .then(this.onReady)
                .catch(this.onError);
        },

        getSubtitleCount: function() {
            return this.times.length;
        },

        getSubtitle: async function(i) {
            const entry = this.times[i];
            if (!entry) return null;
            const subImage = await this._parseSub(entry.offset);
            if (!subImage) return null;
            return {
                ...subImage,
                startTime: entry.startTime,
                endTime: entry.endTime
            };
        },

        _parseIdx: function() {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const lines = e.target.result.split(/\r?\n/);
                    lines.forEach(line => {
                        const trimmedLine = line.trim();
                        if (trimmedLine.startsWith('palette:')) {
                            this.palette = trimmedLine.substring(8).trim().split(', ').map(c => {
                                const s = parseInt(c, 16);
                                return [(s >> 16) & 0xff, (s >> 8) & 0xff, s & 0xff, 255];
                            });
                        } else if (trimmedLine.startsWith('size:')) {
                            const m = trimmedLine.match(/size:\s*(\d+)x(\d+)/);
                            if (m) {
                                this.size.w = parseInt(m[1], 10);
                                this.size.h = parseInt(m[2], 10);
                            }
                        } else if (trimmedLine.startsWith('timestamp:')) {
                            const m = trimmedLine.match(/timestamp:\s*(\d{2}):(\d{2}):(\d{2}):(\d{3}),\s*filepos:\s*([\da-fA-F]+)/);
                            if (m) {
                                const h = parseInt(m[1], 10), min = parseInt(m[2], 10), s = parseInt(m[3], 10), ms = parseInt(m[4], 10);
                                const offset = parseInt(m[5], 16);
                                const startTime = ms + s * 1000 + min * 60000 + h * 3600000;
                                this.times.push({ startTime: startTime, offset: offset });
                            }
                        }
                    });
                    for (let i = 0; i < this.times.length - 1; i++) {
                        this.times[i].endTime = this.times[i + 1].startTime;
                    }
                    if (this.times.length > 0) {
                        this.times[this.times.length - 1].endTime = this.times[this.times.length - 1].startTime + 3000;
                    }
                    resolve();
                };
                reader.onerror = (err) => reject(err);
                reader.readAsText(this.idxFile);
            });
        },

        /**
         * Real DVD-ripped .sub files don't store raw SPU packets at the .idx
         * filepos offset directly - each one is wrapped in an MPEG Program Stream
         * pack header (00 00 01 BA) followed by a private_stream_1 PES packet
         * (00 00 01 BD), exactly like a stripped-down .VOB file. A single SPU
         * packet can also span multiple such pack+PES fragments back to back if
         * it's larger than one PES payload. This unwraps that container and
         * returns the raw, reassembled SPU packet bytes.
         */
        _extractSpuBytes: async function(offset) {
            let filePos = offset;
            let spuBytes = null;
            let spuWritten = 0;
            let expectedLength = null;

            for (let guard = 0; guard < 64; guard++) {
                const headBuf = new Uint8Array(await this.subFile.slice(filePos, filePos + 20).arrayBuffer());
                if (headBuf.length < 14 || headBuf[0] !== 0 || headBuf[1] !== 0 || headBuf[2] !== 1 || headBuf[3] !== 0xba) {
                    break; // Not a valid MPEG pack header - stop.
                }
                const stuffingLength = headBuf[13] & 0x07;
                let p = 14 + stuffingLength;

                // Optional system header (00 00 01 BB) - skip if present.
                const peekBuf = new Uint8Array(await this.subFile.slice(filePos, filePos + p + 6).arrayBuffer());
                if (peekBuf[p] === 0 && peekBuf[p + 1] === 0 && peekBuf[p + 2] === 1 && peekBuf[p + 3] === 0xbb) {
                    const sysHeaderLen = (peekBuf[p + 4] << 8) | peekBuf[p + 5];
                    p += 6 + sysHeaderLen;
                }

                const pesHead = new Uint8Array(await this.subFile.slice(filePos + p, filePos + p + 9).arrayBuffer());
                if (pesHead[0] !== 0 || pesHead[1] !== 0 || pesHead[2] !== 1 || pesHead[3] !== 0xbd) {
                    break; // Not a private_stream_1 (subtitle) PES packet - stop.
                }
                const pesPacketLength = (pesHead[4] << 8) | pesHead[5];
                const headerDataLength = pesHead[8];
                const pesPayloadEnd = filePos + p + 6 + pesPacketLength;
                let dataStart = filePos + p + 9 + headerDataLength;

                if (spuBytes === null) {
                    dataStart += 1; // Skip the 1-byte subtitle substream ID (only present on the first fragment)
                }

                const chunk = new Uint8Array(await this.subFile.slice(dataStart, pesPayloadEnd).arrayBuffer());

                if (spuBytes === null) {
                    if (chunk.length < 4) break;
                    expectedLength = (chunk[0] << 8) | chunk[1];
                    spuBytes = new Uint8Array(expectedLength);
                }

                const toCopy = Math.min(chunk.length, expectedLength - spuWritten);
                spuBytes.set(chunk.subarray(0, toCopy), spuWritten);
                spuWritten += toCopy;

                if (spuWritten >= expectedLength) break;
                filePos = pesPayloadEnd; // Continue into the next pack+PES fragment
            }

            return (spuBytes && spuWritten >= expectedLength) ? spuBytes : null;
        },

        /**
         * Attempts to parse a subpicture control command stream starting at `start`.
         * Returns the parsed color/alpha/coordinate/RLE-offset data if the stream is
         * well-formed (every command recognized, terminating cleanly at 0xFF),
         * or null if it hits anything unrecognized (a sign `start` was wrong).
         */
        _tryParseControlCommands: function(packet, start) {
            let colorMap = [0, 1, 2, 3];
            let alphaMap = this.alpha.slice();
            let rleOffsets = {};
            let coords = null;
            let i = start;
            const end = packet.length;
            let terminated = false;

            while (i < end) {
                const cmd = packet[i++];
                switch (cmd) {
                    case 0x00:
                    case 0x01:
                    case 0x02:
                        break;
                    case 0x03:
                        if (i + 1 >= end) return null;
                        colorMap = [
                            packet[i + 1] & 0x0F, (packet[i + 1] >> 4) & 0x0F,
                            packet[i] & 0x0F, (packet[i] >> 4) & 0x0F
                        ];
                        i += 2;
                        break;
                    case 0x04:
                        if (i + 1 >= end) return null;
                        alphaMap = [
                            packet[i + 1] & 0x0F, (packet[i + 1] >> 4) & 0x0F,
                            packet[i] & 0x0F, (packet[i] >> 4) & 0x0F
                        ];
                        i += 2;
                        break;
                    case 0x05: {
                        if (i + 5 >= end) return null;
                        const w = (((packet[i + 1] & 0x0F) << 8) | packet[i + 2]) - ((packet[i] << 4) | (packet[i + 1] >> 4)) + 1;
                        const h = (((packet[i + 4] & 0x0F) << 8) | packet[i + 5]) - ((packet[i + 3] << 4) | (packet[i + 4] >> 4)) + 1;
                        if (w <= 0 || h <= 0 || w > 2000 || h > 2000) return null; // sanity bounds
                        coords = { w, h };
                        i += 6;
                        break;
                    }
                    case 0x06:
                        if (i + 3 >= end) return null;
                        rleOffsets = {
                            even: (packet[i] << 8) | packet[i + 1],
                            odd: (packet[i + 2] << 8) | packet[i + 3]
                        };
                        i += 4;
                        break;
                    case 0xFF:
                        terminated = true;
                        i = end;
                        break;
                    default:
                        return null; // Unrecognized command - this start offset is wrong
                }
            }

            return terminated ? { colorMap, alphaMap, rleOffsets, coords } : null;
        },

        _parseSub: async function(offset) {
            const packet = await this._extractSpuBytes(offset);
            if (!packet) return null;
            const controlOffset = (packet[2] << 8) | packet[3];

            let subWidth = this.size.w, subHeight = this.size.h;
            let colorMap = [0, 1, 2, 3];
            let alphaMap = this.alpha.slice();
            let rleOffsets = {};

            // The exact size of the small header (a delay + "next sequence" pointer)
            // before the first control command varies slightly between encoders, so
            // try the handful of plausible offsets and use whichever parses as a
            // fully valid, self-terminating command stream.
            let found = null;
            for (let headerLen = 2; headerLen <= 8 && !found; headerLen++) {
                const parsed = this._tryParseControlCommands(packet, controlOffset + headerLen);
                if (parsed && parsed.rleOffsets.even && parsed.rleOffsets.odd) {
                    found = parsed;
                }
            }
            if (!found) return null;

            colorMap = found.colorMap;
            alphaMap = found.alphaMap;
            rleOffsets = found.rleOffsets;
            if (found.coords) {
                subWidth = found.coords.w;
                subHeight = found.coords.h;
            }

            if (!rleOffsets.even || !rleOffsets.odd) {
                return null;
            }

            const imageData = new Uint8ClampedArray(subWidth * subHeight * 4);
            imageData.fill(255); // Default every pixel to opaque white (background) until proven otherwise
            this._decodeRLE(imageData, subWidth, subHeight, packet, rleOffsets.even, 0, colorMap, alphaMap);
            this._decodeRLE(imageData, subWidth, subHeight, packet, rleOffsets.odd, 1, colorMap, alphaMap);

            return { width: subWidth, height: subHeight, imageData: imageData };
        },

        /**
         * Decodes one field (even or odd scanlines) of a DVD subpicture's RLE-encoded
         * pixel data. Real DVD SPU RLE codes are nibble-based (4 bits), not byte-based:
         * each code is 4, 8, 12, or 16 bits long (read MSB-first, 4 bits at a time and
         * accumulated), where the top bits are the run length and the bottom 2 bits are
         * the color slot (0-3). A run length of 0 in the 16-bit form means "fill to the
         * end of the line". Each line's encoding is padded to end on a byte boundary.
         */
        _decodeRLE: function(image, width, height, data, byteOffset, lineParity, colorMap, alphaMap) {
            let bytePos = byteOffset;
            let highNibble = true;
            let x = 0, y = lineParity;

            const getNibble = () => {
                if (bytePos >= data.length) return 0;
                const byte = data[bytePos];
                let nibble;
                if (highNibble) {
                    nibble = (byte >> 4) & 0x0F;
                    highNibble = false;
                } else {
                    nibble = byte & 0x0F;
                    highNibble = true;
                    bytePos++;
                }
                return nibble;
            };

            while (y < height && bytePos < data.length) {
                let val = getNibble();
                if (val < 0x4) {
                    val = (val << 4) | getNibble();
                    if (val < 0x10) {
                        val = (val << 4) | getNibble();
                        if (val < 0x40) {
                            val = (val << 4) | getNibble();
                        }
                    }
                }
                let runLength = val >> 2;
                const color = val & 0x3;
                if (runLength === 0) {
                    runLength = width - x; // Fill to end of line
                }

                for (let k = 0; k < runLength && x < width; k++) {
                    this._drawPixel(image, width, height, x++, y, color, colorMap, alphaMap);
                }

                if (x >= width) {
                    // Each line is padded to a byte boundary before the next one starts.
                    if (!highNibble) { bytePos++; highNibble = true; }
                    x = 0;
                    y += 2;
                }
            }
        },

        /**
         * Renders a decoded pixel as pure black (text ink) or pure white (background),
         * using the subtitle's own semantic color mapping rather than raw palette RGB values.
         * This sidesteps generic thresholding entirely: whatever the on-screen subtitle color
         * scheme was (white text, yellow text, colored outlines...), OCR always receives a
         * clean, high-contrast black-on-white image.
         */
        _drawPixel: function(buffer, width, height, x, y, colorSlot, colorMap, alphaMap) {
            if (x >= width || y >= height) return;
            const idx = (y * width + x) * 4;
            const alpha = alphaMap[colorSlot] || 0;
            const isInk = colorSlot !== 0 && alpha > 0;
            if (isInk) {
                buffer[idx] = 0; buffer[idx + 1] = 0; buffer[idx + 2] = 0; buffer[idx + 3] = 255;
            } else {
                buffer[idx] = 255; buffer[idx + 1] = 255; buffer[idx + 2] = 255; buffer[idx + 3] = 255;
            }
        }
    };

    return VobSub;
})();
