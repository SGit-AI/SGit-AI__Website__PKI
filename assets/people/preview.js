/**
 * preview.js: a file that came inside a sealed message, shown on the page without trusting it.
 *
 * The file is someone else's bytes. It is shown in an iframe with sandbox="" (every restriction: an opaque origin of
 * its own, no scripts, no forms, no popups, no reaching the page that holds it) and srcdoc (it is never a URL), under
 * a Content-Security-Policy that lets it load nothing from anywhere: default-src 'none', with data: for its own image
 * or video only. So a file cannot run code, read the vault, call home, or track the reader. This is how the vault
 * apps are kept apart from the vault UI.
 *
 * What it is shown as is decided from the bytes, not from the name or the type the sender wrote:
 *   image     PNG, JPEG, GIF, WebP by their magic numbers; SVG only as an <img> (an SVG in <img> never runs script)
 *   video     MP4 (ftyp) and WebM; audio: MP3, Ogg, WAV
 *   json      text that parses as JSON: pretty-printed, as text
 *   markdown  a .md name and text: rendered here, from escaped text (no HTML passes through); links and images are
 *             shown as their address, never followed or fetched
 *   text      UTF-8 with no NUL bytes
 * Anything else is offered as a download only.
 *
 * @module preview
 */
const td = new TextDecoder('utf-8', { fatal: true })
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const starts = (b, sig, at = 0) => sig.every((v, i) => b[at + i] === v)
function b64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s) }

/** { kind, mime, text? } for the bytes, or { kind: null } when it is only for download. */
export function sniff(name, bytes) {
    const b = bytes, n = String(name || '').toLowerCase()
    if (starts(b, [0x89, 0x50, 0x4e, 0x47])) return { kind: 'image', mime: 'image/png' }
    if (starts(b, [0xff, 0xd8, 0xff])) return { kind: 'image', mime: 'image/jpeg' }
    if (starts(b, [0x47, 0x49, 0x46, 0x38])) return { kind: 'image', mime: 'image/gif' }
    if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return { kind: 'image', mime: 'image/webp' }
    if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x41, 0x56, 0x45], 8)) return { kind: 'audio', mime: 'audio/wav' }
    if (starts(b, [0x66, 0x74, 0x79, 0x70], 4)) return { kind: 'video', mime: 'video/mp4' }
    if (starts(b, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: 'video', mime: 'video/webm' }
    if (starts(b, [0x4f, 0x67, 0x67, 0x53])) return { kind: 'audio', mime: 'audio/ogg' }
    if (starts(b, [0x49, 0x44, 0x33]) || starts(b, [0xff, 0xfb])) return { kind: 'audio', mime: 'audio/mpeg' }
    let text = null
    if (!b.includes(0)) { try { text = td.decode(b) } catch (e) { text = null } }
    if (text == null) return { kind: null }
    if (/\.svg$/.test(n) && /<svg[\s>]/i.test(text)) return { kind: 'image', mime: 'image/svg+xml' }
    if (/^\s*[[{]/.test(text)) { try { return { kind: 'json', text: JSON.stringify(JSON.parse(text), null, 2) } } catch (e) { /* text */ } }
    if (/\.(md|markdown)$/.test(n)) return { kind: 'markdown', text }
    return { kind: 'text', text }
}

/** Markdown to HTML, from escaped text: headings, paragraphs, lists, quotes, code, emphasis. No HTML, no links followed. */
export function markdown(src) {
    const inline = s => esc(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, '<span class="ref">[image: $1] ‹$2›</span>')
        .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<span class="lnk">$1</span> <span class="ref">‹$2›</span>')
        .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    const out = [], lines = String(src).replace(/\r\n?/g, '\n').split('\n')
    let para = [], list = null, code = null
    const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = [] } if (list) { out.push(`<${list.tag}>` + list.items.map(i => '<li>' + inline(i) + '</li>').join('') + `</${list.tag}>`); list = null } }
    for (const line of lines) {
        if (code) { if (/^```/.test(line)) { out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = null } else code.push(line); continue }
        if (/^```/.test(line)) { flush(); code = []; continue }
        let m
        if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) { flush(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue }
        if (/^\s*(---|\*\*\*)\s*$/.test(line)) { flush(); out.push('<hr>'); continue }
        if ((m = /^>\s?(.*)$/.exec(line))) { flush(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue }
        if ((m = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line))) { const tag = /\d/.test(m[1]) ? 'ol' : 'ul'; if (para.length) flush(); if (!list || list.tag !== tag) { if (list) flush(); list = { tag, items: [] } } list.items.push(m[2]); continue }
        if (!line.trim()) { flush(); continue }
        if (list) flush()
        para.push(line.trim())
    }
    if (code) out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>')
    flush()
    return out.join('\n')
}

const CSP = "default-src 'none'; img-src data:; media-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"
const STYLE = `body{margin:0;padding:14px 16px;font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1c1d21;background:#fff;overflow-wrap:anywhere}
pre{white-space:pre-wrap;font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;margin:0}p pre,li pre{margin:.5em 0}
code{font:13px ui-monospace,Menlo,Consolas,monospace;background:#f2f0e9;padding:0 .2em;border-radius:3px}
pre code{background:none;padding:0}h1,h2,h3{line-height:1.25}blockquote{border-left:3px solid #d5d0c2;margin:.5em 0;padding-left:.8em;color:#5c5f66}
.lnk{text-decoration:underline}.ref{color:#5c5f66;font-size:.85em}img,video{max-width:100%;height:auto;display:block;margin:auto}audio{width:100%}`

/** The srcdoc for a sniffed file: a whole document, its own CSP first. */
export function documentFor(s, bytes) {
    let body
    if (s.kind === 'image') body = `<img alt="" src="data:${s.mime};base64,${b64(bytes)}">`
    else if (s.kind === 'video') body = `<video controls preload="metadata" src="data:${s.mime};base64,${b64(bytes)}"></video>`
    else if (s.kind === 'audio') body = `<audio controls src="data:${s.mime};base64,${b64(bytes)}"></audio>`
    else if (s.kind === 'markdown') body = markdown(s.text)
    else body = `<pre>${esc(s.text)}</pre>`
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="referrer" content="no-referrer"><style>${STYLE}</style></head><body>${body}</body></html>`
}

/** The sandboxed frame for one file, sized to what it holds, in a box the reader can make taller. */
export function frameFor(name, bytes, h) {
    const s = sniff(name, bytes)
    if (!s.kind) return null
    const lines = s.text ? s.text.split('\n').length : 0
    const height = s.kind === 'image' || s.kind === 'video' ? 460 : s.kind === 'audio' ? 90 : Math.min(560, Math.max(80, 34 + lines * (s.kind === 'markdown' ? 26 : 20)))
    const frame = h('iframe', { sandbox: '', referrerpolicy: 'no-referrer', title: `${name}, shown in a sandbox`, class: 'preview-frame' })
    frame.srcdoc = documentFor(s, bytes)
    return { kind: s.kind, el: h('div', { class: 'preview', style: `height:${height}px` }, frame) }
}
