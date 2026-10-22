/* zipfixture.mjs: a zip, written for the tests (stored or deflated entries; a size that can be made to lie). */
import zlib from 'zlib'
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
/** entries: [{ name, bytes, deflate?, lieSize? }] */
export function makeZip(entries) {
    const locals = [], centrals = []; let off = 0
    for (const e of entries) {
        const name = Buffer.from(e.name), data = e.deflate ? zlib.deflateRawSync(e.bytes) : Buffer.from(e.bytes), usize = e.lieSize != null ? e.lieSize : e.bytes.length
        const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(e.deflate ? 8 : 0, 8); lh.writeUInt32LE(crc(e.bytes), 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(usize, 22); lh.writeUInt16LE(name.length, 26)
        const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(e.deflate ? 8 : 0, 10); ch.writeUInt32LE(crc(e.bytes), 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(usize, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42)
        locals.push(lh, name, data); centrals.push(ch, name); off += 30 + name.length + data.length
    }
    const cd = Buffer.concat(centrals), end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16)
    return Buffer.concat([...locals, cd, end])
}
