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
            return await this._parseSub(entry.offset);
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

        _parseSub: async function(offset) {
            const headerBlob = this.subFile.slice(offset, offset + 4);
            const headerBuffer = await headerBlob.arrayBuffer();
            const headerView = new DataView(headerBuffer);
            const packetLength = headerView.getUint16(0);

            const packetBlob = this.subFile.slice(offset, offset + packetLength);
            const packetBuffer = await packetBlob.arrayBuffer();
            const packet = new Uint8Array(packetBuffer);
            const controlOffset = (packet[2] << 8) | packet[3];

            let subWidth = this.size.w, subHeight = this.size.h;
            let rleOffsets = {};

            let i = 4;
            while (i < controlOffset) {
                const cmd = packet[i++];
                switch (cmd) {
                    case 0x05: // Co-ordinates
                        subWidth = (((packet[i + 1] & 0x0F) << 8) | packet[i + 2]) - ((packet[i] << 4) | (packet[i + 1] >> 4)) + 1;
                        subHeight = (((packet[i + 4] & 0x0F) << 8) | packet[i + 5]) - ((packet[i + 3] << 4) | (packet[i + 4] >> 4)) + 1;
                        i += 6;
                        break;
                    case 0x06: // RLE Offsets
                        rleOffsets.even = controlOffset + ((packet[i] << 8) | packet[i + 1]);
                        rleOffsets.odd = controlOffset + ((packet[i + 2] << 8) | packet[i + 3]);
                        i += 4;
                        break;
                    case 0xFF: // End
                        i = controlOffset;
                        break;
                    default:
                        if (cmd < 0x07) i += 2;
                }
            }

            if (!rleOffsets.even || !rleOffsets.odd) {
                return null;
            }

            const imageData = new Uint8ClampedArray(subWidth * subHeight * 4);
            this._decodeRLE(imageData, subWidth, subHeight, packet, rleOffsets.even, 0);
            this._decodeRLE(imageData, subWidth, subHeight, packet, rleOffsets.odd, 1);

            return { width: subWidth, height: subHeight, imageData: imageData };
        },

        _decodeRLE: function(image, width, height, data, offset, lineOffset) {
            let p = offset, x = 0, y = lineOffset, len, color;
            while (p < data.length && y < height) {
                let byte = data[p++];
                if (byte === 0) {
                    byte = data[p++];
                    if (byte === 0) {
                        x = 0; y += 2;
                        continue;
                    }
                    const runType = (byte & 0xC0) >> 6;
                    if (runType === 1) len = ((byte & 0x3F) << 8) | data[p++];
                    else if (runType === 2) len = byte & 0x3F;
                    else if (runType === 3) len = ((byte & 0x3F) << 8) | data[p++];
                    else len = byte & 0x3F;
                    
                    color = (data[p - 1] & 0xC0) >> 6;
                    for (let i = 0; i < len; i++) {
                        if (x < width) this._drawPixel(image, width, height, x++, y, color);
                    }
                } else {
                    const val = byte;
                    let run_len = 1;
                    if (val < 0x40) run_len = val;
                    this._drawPixel(image, width, height, x++, y, val >> 6);
                    if (run_len > 1) {
                         for(let i=1; i<run_len; i++) {
                             if(x<width) this._drawPixel(image, width, height, x++, y, 0);
                         }
                    }
                }
            }
        },

        _drawPixel: function(buffer, width, height, x, y, colorIndex) {
            if (x >= width || y >= height) return;
            const [r, g, b, a] = this.palette[colorIndex] || [0, 0, 0, 0];
            const idx = (y * width + x) * 4;
            buffer[idx] = r; buffer[idx + 1] = g; buffer[idx + 2] = b; buffer[idx + 3] = this.alpha[colorIndex] * 17;
        }
    };

    return VobSub;
})();
