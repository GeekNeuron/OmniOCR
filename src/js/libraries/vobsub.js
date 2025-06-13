/**
 * vobsub.js - A VobSub parser for the HTML5 platform.
 * https://github.com/gz/vobsub.js
 * Copyright (c) 2013-2016, Georgi "Goz" Zlatanov
 * Licensed under the MIT license.
 *
 * MODIFIED FOR MODERN ASYNC/AWAIT AND FILE HANDLING
 */
var VobSub = (function() {
  var VobSub = function(options) {
    if (!options.subFile) throw "subFile is required";
    if (!options.idxFile) throw "idxFile is required";

    this.subFile = options.subFile;
    this.idxFile = options.idxFile;
    this.onReady = options.onReady || function() {};
    this.onError = options.onError || function() {};
    this.debug = !!options.debug;

    this.times = [];
    this.subtitles = []; // This will act as a cache
    this.palette = [];
    this.width = null;
    this.height = null;
  };

  VobSub.prototype = {
    init: function() {
      this._parseIdx()
        .then(() => {
          if (this.onReady) this.onReady();
        })
        .catch(err => {
          if (this.onError) this.onError(err);
        });
    },

    getSubtitleCount: function() {
      return this.times.length;
    },

    getSubtitle: async function(i) {
      if (this.subtitles[i]) {
        return this.subtitles[i];
      }

      var entry = this.times[i];
      if (!entry) return null;

      try {
        const subData = await this._parseSub(entry.offset);
        subData.startTime = entry.startTime;
        subData.endTime = entry.endTime;
        this.subtitles[i] = subData; // Cache the result
        return subData;
      } catch (err) {
        console.error(`Error parsing subtitle #${i}:`, err);
        return null;
      }
    },
    
    _parseIdx: function() {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const contents = e.target.result;
                const lines = contents.split('\n');
                lines.forEach(line => {
                    line = line.trim();
                    if (line.startsWith('palette:')) {
                        this.palette = line.substring(line.indexOf(':') + 1).trim().split(', ').map(c => {
                             const s = parseInt(c, 16);
                             const r = (s >> 16) & 0xff;
                             const g = (s >> 8) & 0xff;
                             const b = s & 0xff;
                             return [r, g, b, 255]; // Add alpha channel
                        });
                    } else if (line.startsWith('size:')) {
                        const m = line.match(/size:\s*(\d+)x(\d+)/);
                        if(m) {
                            this.width = parseInt(m[1], 10);
                            this.height = parseInt(m[2], 10);
                        }
                    } else if (line.startsWith('timestamp:')) {
                        const m = line.match(/timestamp:\s*(\d{2}):(\d{2}):(\d{2}):(\d{3}),\s*filepos:\s*([\da-fA-F]+)/);
                        if(m){
                            const h = parseInt(m[1], 10);
                            const min = parseInt(m[2], 10);
                            const s = parseInt(m[3], 10);
                            const ms = parseInt(m[4], 10);
                            const offset = parseInt(m[5], 16);
                            const startTime = ms + s * 1000 + min * 60 * 1000 + h * 60 * 60 * 1000;
                            this.times.push({ startTime: startTime, offset: offset });
                        }
                    }
                });

                // Calculate end times
                for (let i = 0; i < this.times.length - 1; i++) {
                    this.times[i].endTime = this.times[i+1].startTime;
                }
                if(this.times.length > 0){
                   this.times[this.times.length-1].endTime = this.times[this.times.length-1].startTime + 2000; // Default duration for the last sub
                }
                
                resolve();
            };
            reader.onerror = (err) => reject(err);
            reader.readAsText(this.idxFile);
        });
    },

    _parseSub: async function(offset) {
        // Read the SPU packet header
        const spuHeaderBlob = this.subFile.slice(offset, offset + 0x800); // Read a chunk for the header
        const spuHeaderBuffer = await spuHeaderBlob.arrayBuffer();
        const spuHeader = new Uint8Array(spuHeaderBuffer);

        const packetLength = (spuHeader[0] << 8) | spuHeader[1];
        const controlOffset = (spuHeader[2] << 8) | spuHeader[3];

        // Now read the full packet
        const packetBlob = this.subFile.slice(offset, offset + packetLength);
        const packetBuffer = await packetBlob.arrayBuffer();
        const packet = new Uint8Array(packetBuffer);

        const controlData = packet.subarray(4, controlOffset);
        
        let width = this.width, height = this.height;
        let startX = 0, startY = 0, endX = width - 1, endY = height - 1;
        let palette = [...this.palette];
        let alpha = [0, 8, 8, 8]; // Default alpha values

        let i = 0;
        while (i < controlData.length) {
            const cmd = controlData[i++];
            switch (cmd) {
                case 0x01: // Menu
                    break;
                case 0x03: // Palette
                    palette[3] = this.palette[(controlData[i] & 0xF0) >> 4];
                    palette[2] = this.palette[controlData[i] & 0x0F];
                    palette[1] = this.palette[(controlData[i+1] & 0xF0) >> 4];
                    palette[0] = this.palette[controlData[i+1] & 0x0F];
                    i += 2;
                    break;
                case 0x04: // Alpha
                    alpha[3] = 15 - ((controlData[i] & 0xF0) >> 4);
                    alpha[2] = 15 - (controlData[i] & 0x0F);
                    alpha[1] = 15 - ((controlData[i+1] & 0xF0) >> 4);
                    alpha[0] = 15 - (controlData[i+1] & 0x0F);
                    i += 2;
                    break;
                case 0x05: // Co-ordinates
                    startX = (controlData[i] << 4) | (controlData[i+1] >> 4);
                    endX = ((controlData[i+1] & 0x0F) << 8) | controlData[i+2];
                    startY = (controlData[i+3] << 4) | (controlData[i+4] >> 4);
                    endY = ((controlData[i+4] & 0x0F) << 8) | controlData[i+5];
                    width = endX - startX + 1;
                    height = endY - startY + 1;
                    i += 6;
                    break;
                case 0x06: // RLE Data Offsets
                    // These are offsets within the SPU packet itself.
                    // The actual RLE data follows the control sequence block.
                    const rleOffset = controlOffset; 
                    const evenRleData = packet.subarray(rleOffset + ((controlData[i] << 8) | controlData[i+1]));
                    const oddRleData = packet.subarray(rleOffset + ((controlData[i+2] << 8) | controlData[i+3]));

                    const imageData = this._decodeRLE(width, height, evenRleData, oddRleData, palette, alpha);
                    return { width, height, imageData };
                case 0xFF: // End
                    i = controlData.length;
                    break;
                default:
                    if(this.debug) console.log("Unknown control command:", cmd);
            }
        }
        return null; // Should not be reached if there's RLE data
    },

    _decodeRLE: function(width, height, even, odd, palette, alpha) {
        const buffer = new Uint8ClampedArray(width * height * 4);
        let p_even = 0, p_odd = 0;
        let x = 0, y = 0;

        while (y < height) {
            let nibble_even, nibble_odd;
            if (p_even < even.length) nibble_even = this._getNibble(even, p_even++);
            if (p_odd < odd.length) nibble_odd = this._getNibble(odd, p_odd++);

            this._drawLine(buffer, width, x, y, nibble_even, palette, alpha);
            this._drawLine(buffer, width, x, y+1, nibble_odd, palette, alpha);
            
            x=0;
            y+=2;
        }
        return buffer;
    },

    _getNibble: function(data, p) { /* Helper function used by _decodeRLE */ },
    _drawLine: function(buffer, width, x, y, nibble_data, palette, alpha) { /* Helper function used by _decodeRLE */ }
  };
  // The helper functions need to be defined on the prototype too
  VobSub.prototype._getNibble = function(data, p){
      const byte = data[Math.floor(p/2)];
      return (p % 2 === 0) ? (byte >> 4) : (byte & 0x0F);
  };
  VobSub.prototype._drawLine = function (buffer, width, x, y, nibble_data, palette, alpha) {
    if(y >= this.height) return; // boundary check
    // This logic needs to be fully implemented based on RLE decoding for VobSub
    // A simplified placeholder version:
    for (let i = x; i < width; i++) {
        let k = (y * width + i) * 4;
        let colorIndex = nibble_data > 0 ? nibble_data : 0; // Simplified
        let c = palette[colorIndex] || [0,0,0,0];
        let a = alpha[colorIndex] || 0;
        buffer[k] = c[0]; buffer[k+1] = c[1]; buffer[k+2] = c[2]; buffer[k+3] = a * 17;
    }
  };

  return VobSub;
})();
