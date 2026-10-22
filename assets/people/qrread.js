/**
 * qrread.js: reading a QR code out of an image, and writing one as a PNG, with nothing but this file.
 *
 * Why: a sealed vault key travels between two agent sessions as a QR code image that a person carries (saves, uploads,
 * pastes). The receiving agent has the image as a file and no QR library; a browser may have no BarcodeDetector. So:
 *
 *   decodePng(bytes, inflate)   a PNG (8-bit grey, grey+alpha, RGB, RGBA or palette; not interlaced) to luminance
 *   readQr(lum, w, h)           the text of the one QR code an image holds, axis-aligned, with a light margin around it:
 *                               the PNGs this site and the agent tool make, a crop of a screenshot, a photo straight on.
 *                               It samples module centres, reads the format bits (the nearest of the 32 valid ones),
 *                               unmasks, de-interleaves the blocks and reads byte mode. It does not correct errors: a
 *                               misread module gives text that fails to parse or a signature that fails to check,
 *                               never a wrong secret, because everything it carries here is sealed and signed.
 *   encodePng(lum, w, h, deflate)   a grey PNG, for the agent tool's QR files
 *
 * inflate and deflate are passed in (zlib's in Node; DecompressionStream in a browser), so this runs in both.
 * The two tables are the QR standard's, as qrcode-generator 2.0.4 (MIT, vendored in assets/vendor/) carries them.
 *
 * @module qrread
 */

// error-correction blocks, per version and level (L, M, Q, H): [count, total codewords, data codewords] repeated
const RS = [[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]]
// alignment pattern centres, per version
const ALIGN = [[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]]
const LEVEL = { 1: 'L', 0: 'M', 3: 'Q', 2: 'H' }, LEVEL_ROW = { L: 0, M: 1, Q: 2, H: 3 }

// ------------------------------------------------------------ PNG
const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = (bytes) => { let c = 0xffffffff; for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0
export async function decodePng(bytes, inflate) {
    bytes = new Uint8Array(bytes)
    const SIG = [137, 80, 78, 71, 13, 10, 26, 10]
    if (!SIG.every((v, i) => bytes[i] === v)) throw new Error('not a PNG')
    let o = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, palette = null, trns = null
    const idat = []
    while (o < bytes.length) {
        const len = u32(bytes, o), kind = String.fromCharCode(...bytes.subarray(o + 4, o + 8)), data = bytes.subarray(o + 8, o + 8 + len)
        if (kind === 'IHDR') { w = u32(data, 0); h = u32(data, 4); depth = data[8]; type = data[9]; interlace = data[12] }
        else if (kind === 'PLTE') palette = data
        else if (kind === 'tRNS') trns = data
        else if (kind === 'IDAT') idat.push(data)
        else if (kind === 'IEND') break
        o += 12 + len
    }
    if (!w || !h || w * h > 40e6) throw new Error('a PNG with no size, or too large')
    if (depth !== 8 || interlace) throw new Error('only 8-bit, non-interlaced PNGs are read here (save the image again as a plain PNG)')
    const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
    if (!ch) throw new Error('an unknown PNG colour type')
    const all = new Uint8Array(idat.reduce((s, d) => s + d.length, 0)); let p = 0; for (const d of idat) { all.set(d, p); p += d.length }
    const raw = new Uint8Array(await inflate(all)), stride = w * ch, px = new Uint8Array(stride * h)
    for (let y = 0; y < h; y++) {
        const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride
        for (let x = 0; x < stride; x++) {
            const a = x >= ch ? px[row + x - ch] : 0, b = y ? px[row - stride + x] : 0, c = x >= ch && y ? px[row - stride + x - ch] : 0
            let v = src[x]
            if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1
            else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
            px[row + x] = v & 255
        }
    }
    const lum = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
        let r, g, bl, al = 255
        if (type === 3) { const k = px[i]; r = palette[k * 3]; g = palette[k * 3 + 1]; bl = palette[k * 3 + 2]; if (trns && k < trns.length) al = trns[k] }
        else if (type === 0 || type === 4) { r = g = bl = px[i * ch]; if (type === 4) al = px[i * ch + 1] }
        else { r = px[i * ch]; g = px[i * ch + 1]; bl = px[i * ch + 2]; if (type === 6) al = px[i * ch + 3] }
        const y = 0.299 * r + 0.587 * g + 0.114 * bl
        lum[i] = Math.round(y * al / 255 + 255 * (1 - al / 255))           // on white, as it is shown
    }
    return { lum, w, h }
}
export async function encodePng(lum, w, h, deflate) {
    const raw = new Uint8Array((w + 1) * h)
    for (let y = 0; y < h; y++) raw.set(lum.subarray(y * w, (y + 1) * w), y * (w + 1) + 1)
    const chunk = (kind, data) => {
        const out = new Uint8Array(12 + data.length), k = new TextEncoder().encode(kind)
        out.set([data.length >>> 24, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255]); out.set(k, 4); out.set(data, 8)
        const c = crc32(out.subarray(4, 8 + data.length)); out.set([c >>> 24, (c >>> 16) & 255, (c >>> 8) & 255, c & 255], 8 + data.length)
        return out
    }
    const ihdr = new Uint8Array(13); ihdr.set([w >>> 24, (w >>> 16) & 255, (w >>> 8) & 255, w & 255, h >>> 24, (h >>> 16) & 255, (h >>> 8) & 255, h & 255, 8, 0, 0, 0, 0])
    const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', new Uint8Array(await deflate(raw))), chunk('IEND', new Uint8Array(0))]
    const out = new Uint8Array(parts.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of parts) { out.set(x, o); o += x.length }
    return out
}

// ------------------------------------------------------------ the QR code
const MASKS = [
    (i, j) => (i + j) % 2 === 0, (i) => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => (i * j) % 2 + (i * j) % 3 === 0,
    (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0, (i, j) => ((i * j) % 3 + (i + j) % 2) % 2 === 0]
function bchFormat(data) {
    const digits = d => { let n = 0; while (d) { n++; d >>>= 1 } return n }
    let d = data << 10
    while (digits(d) - digits(0x537) >= 0) d ^= 0x537 << (digits(d) - digits(0x537))
    return ((data << 10) | d) ^ 0x5412
}
const FORMATS = []; for (let ec = 0; ec < 4; ec++) for (let m = 0; m < 8; m++) FORMATS.push({ bits: bchFormat((ec << 3) | m), level: LEVEL[ec], mask: m })
const popcount = x => { let n = 0; while (x) { n += x & 1; x >>>= 1 } return n }

/** The modules that are not data: finders and separators, timing, alignment, format and version areas, the dark module. */
function functionMap(n, version) {
    const f = Array.from({ length: n }, () => new Uint8Array(n)), set = (r, c) => { if (r >= 0 && c >= 0 && r < n && c < n) f[r][c] = 1 }
    for (const [r0, c0] of [[0, 0], [0, n - 8], [n - 8, 0]]) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) set(r0 + r, c0 + c)
    for (let i = 0; i < n; i++) { set(6, i); set(i, 6) }
    const pos = ALIGN[version - 1]
    for (const r of pos) for (const c of pos) {
        if ((r < 9 && c < 9) || (r < 9 && c > n - 10) || (r > n - 10 && c < 9)) continue
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc)
    }
    for (let i = 0; i < 9; i++) { set(8, i); set(i, 8) }
    for (let i = 0; i < 8; i++) { set(8, n - 1 - i); set(n - 1 - i, 8) }
    if (version >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { set(i, n - 11 + j); set(n - 11 + j, i) }
    return f
}
/** The grid of modules, sampled from the image: true is dark. */
function sample(lum, w, h, nWanted) {
    let lo = 255, hi = 0; for (const v of lum) { if (v < lo) lo = v; if (v > hi) hi = v }
    if (hi - lo < 60) throw new Error('no contrast: this image holds no QR code')
    const t = (lo + hi) / 2, dark = (x, y) => lum[y * w + x] < t
    let top = -1, bottom = -1, left = w, right = -1
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (dark(x, y)) { if (top < 0) top = y; bottom = y; if (x < left) left = x; if (x > right) right = x }
    if (top < 0) throw new Error('no dark pixels')
    // the top-left finder's first row is seven dark modules
    let run = 0; const ry = top + 1 < h ? top + 1 : top
    let x0 = left; while (x0 < w && !dark(x0, ry)) x0++
    while (x0 + run < w && dark(x0 + run, ry)) run++
    const est = run / 7, width = right - left + 1, height = bottom - top + 1
    if (!nWanted) {                                         // the sizes it could be: blur makes the finder look thinner
        const guess = width / est, out = []
        for (let v = 1; v <= 40; v++) { const m = 17 + 4 * v; if (Math.abs(m - guess) <= Math.max(4, guess * 0.15)) out.push(m) }
        return out.sort((a, b) => Math.abs(a - guess) - Math.abs(b - guess))
    }
    const n = nWanted
    let mx = width / n, my = height / n, ox = left, oy = top
    const rad = Math.max(0, Math.floor(Math.min(mx, my) * 0.2))
    const at = (cx, cy) => {
        cx = Math.floor(cx); cy = Math.floor(cy)
        let s = 0, k = 0
        for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < w && y < h) { s += lum[y * w + x]; k++ } }
        return k ? s / k < t : false
    }
    // calibrate the grid on the timing patterns (row 6 and column 6 alternate, dark on even modules): an edge measured a
    // pixel off, over a hundred modules, is enough to sample the wrong ones at the far side of a large code
    const fit = (horizontal) => {
        let bestO = horizontal ? ox : oy, bestM = horizontal ? mx : my, bestS = -1
        const o0 = bestO, m0 = bestM
        for (let dm = -0.012; dm <= 0.0121; dm += 0.0015) for (let doff = -0.5; doff <= 0.51; doff += 0.125) {
            const m = m0 * (1 + dm), o = o0 + doff * m0
            // row (or column) 6 end to end: the finders' dark edge, the light separators, and the timing between
            let sc = 0
            for (let i = 0; i < n; i++) {
                const want = i < 7 || i > n - 8 ? true : i === 7 || i === n - 8 ? false : i % 2 === 0
                const d = horizontal ? at(o + (i + 0.5) * m, oy + 6.5 * my) : at(ox + 6.5 * mx, o + (i + 0.5) * m)
                if (d === want) sc++
            }
            sc -= (Math.abs(dm) * 10 + Math.abs(doff)) * 0.01               // a tie goes to the smallest correction
            if (sc > bestS) { bestS = sc; bestO = o; bestM = m }
        }
        if (horizontal) { ox = bestO; mx = bestM } else { oy = bestO; my = bestM }
    }
    for (let pass = 0; pass < 2; pass++) { fit(true); fit(false) }
    return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => at(ox + (c + 0.5) * mx, oy + (r + 0.5) * my)))
}
export function readQr(lum, w, h) {
    let last = null
    for (const n of sample(lum, w, h)) { try { return readAt(sample(lum, w, h, n)) } catch (e) { last = e } }
    throw last || new Error('no QR code found')
}
function readAt(g) {
    const n = g.length, version = (n - 17) / 4
    // the format bits, the copy down column 8 (rows 0-5, 7, 8, then the bottom-left run), as the generator places them
    let fmt = 0
    for (let i = 0; i < 15; i++) { const r = i < 6 ? i : i < 8 ? i + 1 : n - 15 + i; if (g[r][8]) fmt |= 1 << i }
    let fmt2 = 0
    for (let i = 0; i < 15; i++) { const c = i < 8 ? n - i - 1 : i < 9 ? 15 - i : 15 - i - 1; if (g[8][c]) fmt2 |= 1 << i }
    let best = null
    for (const f of FORMATS) for (const x of [fmt, fmt2]) { const d = popcount(f.bits ^ x); if (!best || d < best.d) best = { ...f, d } }
    if (best.d > 3) throw new Error('the format bits do not read: not a QR code, or not straight on')
    const fn = functionMap(n, version), mask = MASKS[best.mask], bits = []
    let up = true
    for (let col = n - 1; col > 0; col -= 2) {
        if (col === 6) col -= 1
        for (let k = 0; k < n; k++) {
            const row = up ? n - 1 - k : k
            for (let c = 0; c < 2; c++) { const cc = col - c; if (!fn[row][cc]) bits.push(g[row][cc] !== mask(row, cc) ? 1 : 0) }
        }
        up = !up
    }
    const cws = []; for (let i = 0; i + 8 <= bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cws.push(b) }
    // de-interleave: the data codewords of every block, a byte from each in turn
    const row = RS[(version - 1) * 4 + LEVEL_ROW[best.level]], blocks = []
    for (let i = 0; i < row.length; i += 3) for (let j = 0; j < row[i]; j++) blocks.push({ total: row[i + 1], data: row[i + 2], out: [] })
    const maxData = Math.max(...blocks.map(b => b.data)); let p = 0
    for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.data) b.out.push(cws[p++])
    const data = blocks.flatMap(b => b.out)
    // byte-mode segments, until the terminator
    let bit = 0
    const take = (k) => { let v = 0; for (let i = 0; i < k; i++) { const byte = data[(bit >> 3)]; v = (v << 1) | ((byte >> (7 - (bit & 7))) & 1); bit++ } return v }
    const out = []
    while (bit + 4 <= data.length * 8) {
        const mode = take(4)
        if (mode === 0) break
        if (mode !== 4) throw new Error(`a QR segment in mode ${mode}: only byte mode is read here`)
        const len = take(version < 10 ? 8 : 16)
        if (bit + len * 8 > data.length * 8) throw new Error('the QR data runs past its end: misread')
        for (let i = 0; i < len; i++) out.push(take(8))
    }
    if (!out.length) throw new Error('no data in the QR code: misread')
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(out))
}
