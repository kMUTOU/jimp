import { isNodePattern, throwError } from '@jimp/utils';

/**
 * Applies a true Gaussian blur to the image (warning: this is VERY slow)
 * @param {number} r the pixel radius of the blur
 * @param {function(Error, Jimp)} cb (optional) a callback for when complete
 * @returns {Jimp} this for chaining of methods
 */
export default () => ({
  halftone(sample, cb) {
    // http://blog.ivank.net/fastest-gaussian-blur.html
    if (typeof sample !== 'number') {
      return throwError.call(this, 'sample must be a number', cb);
    }

    if (sample < 1) {
      return throwError.call(this, 'sample must be greater than 0', cb);
    }

    const newData = Buffer.from(this.bitmap.data);

    this.scanQuiet(0, 0, this.bitmap.width, this.bitmap.height, (x, y, idx) => {
      for (let y = 0; y < this.bitmap.height; y = y + sample) {
        for (let x = 0; x < this.bitmap.width; x = x + sample) {
          let level = 0;
          let diameter = 0.0;
          let x1, x2, y1, y2, radius;

          for (let iy = 0; iy < sample; iy++) {
            for (let ix = 0; ix < sample; ix++) {
              idxi = this.getPixelIndex(
                x + xi,
                y + yi,
                this.constructor.EDGE_EXTEND
              );
              // grey scale値を計算
              level += parseInt(
                0.2126 * this.bitmap.data[idxi] +
                  0.7152 * this.bitmap.data[idxi + 1] +
                  0.0722 * this.bitmap.data[idxi + 2],
                10
              );
            }
          }

          level = level / (sample * sample);
          diameter = (1 - (level / 0xff) ** 0.5) * sample;

          x1 = x + (sample - diameter) / 2;
          y1 = y + (sample - diameter) / 2;
          x2 = x1 + diameter;
          y2 = y1 + diameter;
          radius = ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;

          const curR = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));

          for (let iy = 0; iy < sample; iy++) {
            for (let ix = 0; ix < sample; ix++) {
              idxi = this.getPixelIndex(
                x + xi,
                y + yi,
                this.constructor.EDGE_EXTEND
              );
              // grey scale値を計算
              if (radius - curR <= 0.0) {
                newData[idx + 0] = 0x00;
                newData[idx + 1] = 0x00;
                newData[idx + 2] = 0x00;
              } else if (radius - curR > 0.0) {
                newData[idx + 0] = 0xff;
                newData[idx + 1] = 0xff;
                newData[idx + 2] = 0xff;
              }
            }
          }
        }
      }
    });

    this.bitmap.data = newData;

    if (isNodePattern(cb)) {
      cb.call(this, null, this);
    }

    return this;
  }
});
