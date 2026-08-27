// png.mjs — a minimal PNG decoder, just enough for the blank check.
//
// Published with the harness so the blank gate has no dependency that could
// go missing: the check that stops a white rectangle reaching print must not
// itself be the thing that fails to install. Handles the colour types
// Chromium's screenshots actually emit (8-bit RGB and RGBA, non-interlaced)
// and refuses anything else rather than guessing.

import { inflateSync } from 'node:zlib';

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export const PNG = {
  decode(buf) {
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
    let pos = 8, width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
    const idat = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === 'IHDR') {
        width = data.readUInt32BE(0); height = data.readUInt32BE(4);
        depth = data[8]; colorType = data[9]; interlace = data[12];
      } else if (type === 'IDAT') idat.push(data);
      else if (type === 'IEND') break;
      pos += 12 + len;
    }
    if (depth !== 8) throw new Error(`unsupported bit depth ${depth}`);
    if (interlace !== 0) throw new Error('interlaced PNG unsupported');
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
    if (!channels) throw new Error(`unsupported colour type ${colorType}`);

    const raw = inflateSync(Buffer.concat(idat));
    const bpp = channels;
    const stride = width * bpp;
    const out = Buffer.alloc(width * height * 4);
    let prev = Buffer.alloc(stride);

    for (let y = 0, o = 0; y < height; y++) {
      const filter = raw[o++];
      const line = Buffer.from(raw.subarray(o, o + stride));
      o += stride;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? line[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
        let v = line[x];
        if (filter === 1) v += a;
        else if (filter === 2) v += b;
        else if (filter === 3) v += (a + b) >> 1;
        else if (filter === 4) v += paeth(a, b, c);
        line[x] = v & 0xff;
      }
      for (let x = 0; x < width; x++) {
        const s = x * bpp, d = (y * width + x) * 4;
        out[d] = line[s]; out[d + 1] = line[s + 1]; out[d + 2] = line[s + 2];
        out[d + 3] = channels === 4 ? line[s + 3] : 255;
      }
      prev = line;
    }
    return { width, height, data: out };
  },
};
