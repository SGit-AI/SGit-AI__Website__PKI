/**
 * qrimage.js: the text of the QR code in an image, in a browser: the browser's own detector when it has one, this
 * site's reader (qrread.js) when not. Shared by the message page and Send.
 *
 * @module qrimage
 */
import * as QR from './qrread.js'

export async function readImage(blob) {
    const bmp = await createImageBitmap(blob)
    if ('BarcodeDetector' in window) { try { const r = await new BarcodeDetector({ formats: ['qr_code'] }).detect(bmp); if (r[0] && r[0].rawValue) return r[0].rawValue } catch (e) { /* the reader below */ } }
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(bmp, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data, lum = new Uint8Array(c.width * c.height)
    for (let i = 0; i < lum.length; i++) lum[i] = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2])
    return QR.readQr(lum, c.width, c.height)
}
export const isImage = b => (b[0] === 0x89 && b[1] === 0x50) || (b[0] === 0xff && b[1] === 0xd8) || (b[0] === 0x47 && b[1] === 0x49) || (b[0] === 0x52 && b[8] === 0x57)
