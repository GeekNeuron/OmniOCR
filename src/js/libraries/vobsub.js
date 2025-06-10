/**
 * vobsub.js - A VobSub parser for the HTML5 platform.
 * https://github.com/gz/vobsub.js
 * * Copyright (c) 2013-2016, Georgi "Goz" Zlatanov
 * Licensed under the MIT license.
 */
var VobSub = (function() {
  var VobSub = function(options) {
    if (!options.subFile) {
      throw "subFile is required";
    }
    this.subFile = options.subFile;
    this.idxFile = options.idxFile;
    this.onReady = options.onReady;
    this.onError = options.onError || function() {};
    this.debug = !!options.debug;
    this.times = [];
    this.subtitles = [];
    this.palette = [];
    this.width = null;
    this.height = null;
  };

  VobSub.prototype = {
    init: function() {
      this._parseIdx(function() {
        if (this.onReady) {
          this.onReady();
        }
      });
    },

    getSubtitleCount: function() {
      return this.subtitles.length;
    },

    getSubtitle: function(i) {
      if (this.subtitles[i]) {
        return this.subtitles[i];
      }
      var entry = this.times[i];
      if (entry) {
        this.subtitles[i] = this._parseSub(entry.offset, entry.nextOffset);
        this.subtitles[i].startTime = entry.startTime;
        this.subtitles[i].endTime = entry.endTime;
        return this.subtitles[i];
      }
    },

    _parseIdx: function(callback) {
      var self = this;
      var reader = new FileReader();
      reader.onload = function(e) {
        var contents = e.target.result;
        var lines = contents.split('\n');
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (line.indexOf('palette:') === 0) {
            self.palette = line.substring(line.indexOf(':') + 2).split(', ').map(function(c) {
              var s = parseInt(c, 16);
              var r = (s >> 16) & 0xFF;
              var g = (s >> 8) & 0xFF;
              var b = s & 0xFF;
              return [r, g, b];
            });
          } else if (line.indexOf('size:') === 0) {
            var m = line.match(/size: (\d+)x(\d+)/);
            self.width = m[1];
            self.height = m[2];
          } else if (line.indexOf('timestamp:') === 0) {
            var m = line.match(/timestamp: (\d{2}):(\d{2}):(\d{2}):(\d{3}), filepos: ([\da-f]+)/);
            var h = parseInt(m[1], 10);
            var min = parseInt(m[2], 10);
            var s = parseInt(m[3], 10);
            var ms = parseInt(m[4], 10);
            var offset = parseInt(m[5], 16);
            var startTime = ms + s * 1000 + min * 60 * 1000 + h * 60 * 60 * 1000;
            self.times.push({
              startTime: startTime,
              offset: offset
            });
          }
        }
        for (var i = 0; i < self.times.length - 1; i++) {
          self.times[i].nextOffset = self.times[i + 1].offset;
          self.times[i].endTime = self.times[i + 1].startTime;
        }
        callback.call(self);
      };
      reader.readAsText(this.idxFile);
    },

    _parseSub: function(offset, nextOffset) {
      var self = this;
      var file = this.subFile.slice(offset, nextOffset);
      var reader = new FileReader();
      var data = new Uint8Array(reader.readAsArrayBuffer(file));
      var i = 0;
      while (i < data.length && data[i] !== 0x53) {
        i++;
      }
      i += 2;
      var spuOffset = (data[i] << 8) | data[i + 1];
      i += 2;
      var controlOffset = (data[i] << 8) | data[i + 1];
      var controlData = data.subarray(controlOffset, spuOffset);
      var spuData = data.subarray(spuOffset);
      var width, height;
      var startX, startY, endX, endY;
      var palette = [];
      var alpha = [];
      i = 0;
      while (i < controlData.length) {
        var cmd = controlData[i];
        i++;
        switch (cmd) {
          case 0x01:
            break;
          case 0x02:
            i += 2;
            break;
          case 0x03:
            var p1 = controlData[i];
            var p2 = controlData[i + 1];
            palette[0] = this.palette[(p1 & 0xF0) >> 4];
            palette[1] = this.palette[p1 & 0x0F];
            palette[2] = this.palette[(p2 & 0xF0) >> 4];
            palette[3] = this.palette[p2 & 0x0F];
            i += 2;
            break;
          case 0x04:
            var a1 = controlData[i];
            var a2 = controlData[i + 1];
            alpha[0] = (a1 & 0xF0) >> 4;
            alpha[1] = a1 & 0x0F;
            alpha[2] = (a2 & 0xF0) >> 4;
            alpha[3] = a2 & 0x0F;
            i += 2;
            break;
          case 0x05:
            startX = (controlData[i] << 4) | (controlData[i + 1] >> 4);
            endX = ((controlData[i + 1] & 0x0F) << 8) | controlData[i + 2];
            startY = (controlData[i + 3] << 4) | (controlData[i + 4] >> 4);
            endY = ((controlData[i + 4] & 0x0F) << 8) | controlData[i + 5];
            i += 6;
            break;
          case 0x06:
            var off1 = (controlData[i] << 8) | controlData[i + 1];
            var off2 = (controlData[i + 2] << 8) | controlData[i + 3];
            var p = 0;
            var q = 0;
            var len, color;
            var line1 = spuData.subarray(off1);
            var line2 = spuData.subarray(off2);
            var x = startX;
            var y = startY;
            width = endX - startX + 1;
            height = endY - startY + 1;
            var buffer = new Uint8ClampedArray(width * height * 4);
            while (p < line1.length && q < line2.length) {
              var b1 = line1[p];
              var b2 = line2[q];
              if (b1 < b2) {
                len = b1;
                color = 0;
                p++;
              } else if (b2 < b1) {
                len = b2;
                color = 1;
                q++;
              } else {
                len = b1;
                color = 2;
                p++;
                q++;
              }
              for (var j = 0; j < len; j++) {
                if (x >= width) {
                  x = startX;
                  y++;
                }
                var c = palette[color];
                var a = alpha[color];
                var k = (y * width + x) * 4;
                buffer[k] = c[0];
                buffer[k + 1] = c[1];
                buffer[k + 2] = c[2];
                buffer[k + 3] = a * 17;
                x++;
              }
            }
            i += 4;
            break;
          case 0xFF:
            i = controlData.length;
            break;
        }
      }
      return {
        width: width,
        height: height,
        imageData: buffer
      };
    }
  };
  return VobSub;
})();

