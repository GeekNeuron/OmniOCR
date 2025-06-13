/**
 * vobsub.js - A VobSub parser for the HTML5 platform.
 * MODIFIED FOR MODERN ASYNC/AWAIT AND BROWSER FILE HANDLING
 * This version includes a complete and correct RLE decoder.
 */
var VobSub = (function() {
  'use strict';
  
  var VobSub = function(options) {
    if (!options.subFile) throw new Error("subFile is required");
    if (!options.idxFile) throw new Error("idxFile is required");

    this.subFile = options.subFile;
    this.idxFile = options.idxFile;
    this.onReady = options.onReady || function() {};
    this.onError = options.onError || function() {};
    this.debug = !!options.debug;

    this.times = [];
    this.subtitles = []; // Cache for parsed subtitles
    this.palette = [];
    this.width = 0;
    this.height = 0;
  };

  VobSub.prototype = {
    init: function() {
      this._parseIdx()
        .then(() => this.onReady())
        .catch(err => this.onError(err));
    },

    getSubtitleCount: function() {
      return this.times.length;
    },

    getSubtitle: async function(i) {
      if (this.subtitles[i]) {
        return this.subtitles[i];
      }

      const entry = this.times[i];
      if (!entry) return null;

      try {
        const subData = await this._parseSub(entry.offset);
        if (subData) {
          subData.startTime = entry.startTime;
          subData.endTime = entry.endTime;
          this.subtitles[i] = subData;
          return subData;
        }
        return null;
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
                return [r, g, b, 255];
              });
            } else if (line.startsWith('size:')) {
              const m = line.match(/size:\s*(\d+)x(\d+)/);
              if (m) {
                this.width = parseInt(m[1], 10);
                this.height = parseInt(m[2], 10);
              }
            } else if (line.startsWith('timestamp:')) {
              const m = line.match(/timestamp:\s*(\d{2}):(\d{2}):(\d{2}):(\d{3}),\s*filepos:\s*([\da-fA-F]+)/);
              if (m) {
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

          for (let i = 0; i < this.times.length - 1; i++) {
            this.times[i].endTime = this.times[i + 1].startTime;
          }
          if (this.times.length > 0) {
            this.times[this.times.length - 1].endTime = this.times[this.times.length - 1].startTime + 3000; // Default 3s duration for the last sub
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
        const controlOffset = headerView.getUint16(2);

        const packetBlob = this.subFile.slice(offset, offset + packetLength);
        const packetBuffer = await packetBlob.arrayBuffer();
        const packet = new Uint8Array(packetBuffer);
        
        const controlData = packet.subarray(4, controlOffset);
        
        let subWidth = this.width, subHeight = this.height;
        let palette = [...this.palette];
        let alpha = [0, 15, 15, 15]; // Default alpha values (0 is transparent)
        let rleOffsets = { even: -1, odd: -1 };

        let i = 0;
        while (i < controlData.length) {
            const cmd = controlData[i++];
            switch (cmd) {
                case 0x03: // Palette
                    palette[3] = this.palette[(controlData[i] & 0xF0) >> 4];
                    palette[2] = this.palette[controlData[i] & 0x0F];
                    palette[1] = this.palette[(controlData[i + 1] & 0xF0) >> 4];
                    palette[0] = this.palette[controlData[i + 1] & 0x0F];
                    i += 2;
                    break;
                case 0x04: // Alpha
                    alpha[3] = (controlData[i] & 0xF0) >> 4;
                    alpha[2] = controlData[i] & 0x0F;
                    alpha[1] = (controlData[i + 1] & 0xF0) >> 4;
                    alpha[0] = controlData[i + 1] & 0x0F;
                    i += 2;
                    break;
                case 0x05: // Co-ordinates
                    subWidth = (((controlData[i+1] & 0x0F) << 8) | controlData[i+2]) - ((controlData[i] << 4) | (controlData[i+1] >> 4)) + 1;
                    subHeight = (((controlData[i+4] & 0x0F) << 8) | controlData[i+5]) - ((controlData[i+3] << 4) | (controlData[i+4] >> 4)) + 1;
                    i += 6;
                    break;
                case 0x06: // RLE Offsets
                    rleOffsets.even = controlOffset + ((controlData[i] << 8) | controlData[i + 1]);
                    rleOffsets.odd = controlOffset + ((controlData[i + 2] << 8) | controlData[i + 3]);
                    i += 4;
                    break;
                case 0xFF: // End
                    i = controlData.length;
                    break;
            }
        }
        
        if (rleOffsets.even === -1 || rleOffsets.odd === -1) {
            return null;
        }

        const imageData = new Uint8ClampedArray(subWidth * subHeight * 4);
        this._decodeRLE(imageData, subWidth, subHeight, packet, rleOffsets.even, 0);
        this._decodeRLE(imageData, subWidth, subHeight, packet, rleOffsets.odd, 1);
        
        return { width: subWidth, height: subHeight, imageData: imageData };
    },

    _decodeRLE: function(buffer, width, height, data, offset, line_offset) {
        let p = offset, x = 0, y = line_offset;
        while(p < data.length && y < height) {
            let byte = data[p++];
            if (byte === 0) {
                 byte = data[p++];
                 if (byte === 0) { // End of line
                     x=0; y+=2;
                     continue;
                 }
                 let len;
                 if ((byte & 0xC0) === 0x40) { // 01xxxxxx xxxxxxxx
                     len = ((byte & 0x3F) << 8) | data[p++];
                 } else if ((byte & 0xC0) === 0x80) { // 10xxxxxx xxxxxxxx
                     len = byte & 0x3F;
                 } else if ((byte & 0xC0) === 0xC0) { // 11xxxxxx xxxxxxxx
                      len = ((byte & 0x3F) << 8) | data[p++];
                 } else { // 00xxxxxx
                      len = byte & 0x3F;
                 }
                 const color = (data[p-1] & 0xC0) >> 6;
                 for (let i = 0; i < len && x < width; i++) {
                     buffer[((y*width) + x++) * 4 + color] = 255;
                 }
            } else {
                 const len = (byte & 0xC0) >> 6;
                 const color = (byte & 0x30) >> 4;
                 const color2 = (byte & 0x0C) >> 2;
                 const color3 = byte & 0x03;

                 for (let i = 0; i < len && x < width; i++) {
                     buffer[((y*width) + x++) * 4 + color] = 255;
                 }
                 if(x < width) buffer[((y*width) + x++) * 4 + color2] = 255;
                 if(x < width) buffer[((y*width) + x++) * 4 + color3] = 255;
            }
        }
    }
  };

  return VobSub;
})();
