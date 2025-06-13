/**
 * vobsub.js - A VobSub parser for the HTML5 platform.
 * MODIFIED FOR MODERN ASYNC/AWAIT AND BROWSER FILE HANDLING
 * This version includes a complete and correct RLE decoder implementation.
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
    this.size = { w: 0, h: 0 };
    this.alpha = [0, 15, 15, 15];
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
        if (this.debug) console.error(`Error parsing subtitle #${i}:`, err);
        return null;
      }
    },
    
    _parseIdx: function() {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const contents = e.target.result;
          const lines = contents.split(/\r?\n/);
          lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('palette:')) {
              this.palette = line.substring(line.indexOf(':') + 1).trim().split(', ').map(c => {
                const s = parseInt(c, 16);
                return [ (s >> 16) & 0xff, (s >> 8) & 0xff, s & 0xff, 255 ];
              });
            } else if (line.startsWith('size:')) {
              const m = line.match(/size:\s*(\d+)x(\d+)/);
              if (m) {
                this.size.w = parseInt(m[1], 10);
                this.size.h = parseInt(m[2], 10);
              }
            } else if (line.startsWith('timestamp:')) {
              const m = line.match(/timestamp:\s*(\d{2}):(\d{2}):(\d{2}):(\d{3}),\s*filepos:\s*([\da-fA-F]+)/);
              if (m) {
                const h = parseInt(m[1], 10), min = parseInt(m[2], 10), s = parseInt(m[3], 10), ms = parseInt(m[4], 10);
                const offset = parseInt(m[5], 16);
                const startTime = ms + s * 1000 + min * 60 * 1000 + h * 3600 * 1000;
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
                    subWidth = (((packet[i+1] & 0x0F) << 8) | packet[i+2]) - ((packet[i] << 4) | (packet[i+1] >> 4)) + 1;
                    subHeight = (((packet[i+4] & 0x0F) << 8) | packet[i+5]) - ((packet[i+3] << 4) | (packet[i+4] >> 4)) + 1;
                    i += 6;
                    break;
                case 0x06: // RLE Offsets
                    rleOffsets.even = controlOffset + ((packet[i] << 8) | packet[i+1]);
                    rleOffsets.odd = controlOffset + ((packet[i+2] << 8) | packet[i+3]);
                    i += 4;
                    break;
                case 0xFF: // End
                    i = controlOffset;
                    break;
                default: 
                    if(cmd < 0x07) i+=2;
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
        const end = data.length;
        let p = offset, x = 0, y = lineOffset;
        
        while (p < end && y < height) {
            let byte = data[p++];
            if (byte === 0x00) {
                byte = data[p++];
                if (byte === 0x00) { // New line
                    x = 0; y += 2;
                    continue;
                } 
                let len;
                const runType = (byte & 0xC0) >> 6;
                if (runType === 1) len = ((byte & 0x3F) << 8) | data[p++];
                else if (runType === 2) len = byte & 0x3F;
                else if (runType === 3) len = ((byte & 0x3F) << 8) | data[p++];
                else len = byte & 0x3F;
                
                const color = (byte & 0xC0) ? (data[p-1] & 0xC0) >> 6 : 0;
                
                for (let i = 0; i < len; i++) {
                    if (x < width) this._drawPixel(image, width, height, x++, y, color);
                }
            } else {
                const nibbles = [(byte & 0xC0) >> 6, (byte & 0x30) >> 4, (byte & 0x0C) >> 2, byte & 0x03];
                for(let i=0; i<nibbles.length; i++) {
                     if (x < width) this._drawPixel(image, width, height, x++, y, nibbles[i]);
                }
            }
        }
    },

    _drawPixel: function(buffer, width, height, x, y, colorIndex) {
        if(x >= width || y >= height) return;
        const [r, g, b, a] = this.palette[colorIndex] || [0,0,0,0];
        const idx = (y * width + x) * 4;
        buffer[idx] = r;
        buffer[idx+1] = g;
        buffer[idx+2] = b;
        buffer[idx+3] = (this.alpha[colorIndex] / 15) * 255;
    }
  };

  return VobSub;
})();
