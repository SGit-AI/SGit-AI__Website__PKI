/**
 * unzip.js: the files in a zip, read here, so a batch of QR codes (an agent hands over eight at once) can be brought as
 * one file. Stored and deflated entries only, read from the central directory; names are kept as labels and never used
 * as paths. Bounded, because a zip is someone else's file: at most 200 entries, 10 MB an entry and 60 MB in all once
 * inflated, and an entry that inflates past its declared size is refused (a zip bomb stops at the bound, not at the
 * memory's end).
 *
 *   unzip(bytes, inflateRaw) -> [{ name, bytes } | { name, error }]     inflateRaw(data, max): zlib's inflateRawSync with maxOutputLength
 *                                                       in Node; DecompressionStream('deflate-raw'), read until max, in a browser
 *
 * @module unzip
 */
export const LIMITS = { entries: 200, entry: 10 * 1024 * 1024, total: 60 * 1024 * 1024 }
const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
export const isZip = b => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04

export async function unzip(bytes, inflateRaw) {
    const b = new Uint8Array(bytes)
    let eocd = -1
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break }
    if (eocd < 0) throw new Error('not a zip (no central directory)')
    const count = u16(b, eocd + 10), cdOffset = u32(b, eocd + 16)
    if (count > LIMITS.entries) throw new Error(`${count} entries: more than the ${LIMITS.entries} read here`)
    const out = [], td = new TextDecoder()
    let p = cdOffset, total = 0
    for (let n = 0; n < count; n++) {
        if (u32(b, p) !== 0x02014b50) throw new Error('a broken central directory')
        const method = u16(b, p + 10), csize = u32(b, p + 20), usize = u32(b, p + 24), nlen = u16(b, p + 28), xlen = u16(b, p + 30), clen = u16(b, p + 32), local = u32(b, p + 42)
        const name = td.decode(b.subarray(p + 46, p + 46 + nlen))
        p += 46 + nlen + xlen + clen
        if (name.endsWith('/') || /(^|\/)(__MACOSX|\.DS_Store)/.test(name)) continue
        if (usize > LIMITS.entry || (total += usize) > LIMITS.total) throw new Error(`${name}: larger than this page reads (${LIMITS.entry / 1048576} MB a file, ${LIMITS.total / 1048576} MB in all)`)
        if (u32(b, local) !== 0x04034b50) throw new Error(`${name}: a broken entry`)
        const start = local + 30 + u16(b, local + 26) + u16(b, local + 28), data = b.subarray(start, start + csize)
        // an entry that does not read is that entry's error, not the whole zip's: the others are still read
        const short = name.split('/').pop()
        try {
            let content
            if (method === 0) content = data
            else if (method === 8) content = new Uint8Array(await inflateRaw(data, usize + 1))      // stops one byte past what it declares
            else throw new Error(`compressed in a way not read here (method ${method})`)
            if (content.length !== usize) throw new Error(`inflates past the ${usize} bytes it declares: refused`)
            out.push({ name: short, bytes: content })
        } catch (e) { out.push({ name: short, error: e.message }) }
    }
    return out
}

/** The browser's inflate, stopping at max bytes: a stream read chunk by chunk, cancelled past the bound. */
export async function inflateRawBrowser(data, max) {
    const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader()
    const parts = []; let n = 0
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        parts.push(value); n += value.length
        if (n > max) { await reader.cancel(); break }
    }
    const out = new Uint8Array(n); let o = 0; for (const x of parts) { out.set(x, o); o += x.length }
    return out
}
