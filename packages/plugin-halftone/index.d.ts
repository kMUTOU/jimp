import { ImageCallback } from '@jimp/core';

interface Halftone {
  halftone(sample: number, cb?: ImageCallback<this>): this;
}

export default function(): Halftone;
