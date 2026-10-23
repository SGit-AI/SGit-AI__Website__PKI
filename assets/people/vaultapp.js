/**
 * vaultapp.js: a vault's own app, run the way the SG/App host (vault.sgraph.ai) runs it. The app's entry HTML goes into
 * an iframe as srcdoc, sandbox "allow-scripts allow-forms" (an opaque origin of its own: it cannot reach this page, its
 * storage or its keys), with a window.sg bridge injected first in <head>. The bridge asks this page for the app's files
 * over postMessage, and this page answers from the vault it opened, read-only:
 *
 *   sg.vfs.read / readText / list      a file's bytes, its text, a folder's entries (paths resolve against the page)
 *   sg.loadCss / sg.loadJs             a vault stylesheet or script, inlined
 *   img.src = "photos/a.webp"          read from the vault and set as a blob: URL (and <img src> already in the page)
 *   <a href="other.html">              the other page, mounted in place; http(s) links open after a confirm, here
 *   sg.app { context, selfPath, writable: false, vaultName, vaultId, fileCount }
 *
 * Writes answer EROFS: a key that came sealed to you opens the vault to read. .vault/ (the vault's own internals) is
 * never served. connect-src is blob: and data: only, so the app cannot send what it reads anywhere: the bridge is
 * its only way out. The contract is library/guides/vault-html/AUTHORING.md in SGraph-AI__App__Send.
 *
 *   appEntry(v)                       { entry, title, css, js } from .vault/app.json or app.json, or index.html; or null
 *   mountApp(v, host, app, { onError, onNav })   the frame, filling host
 *
 * @module vaultapp
 */
import { A } from './ui.js'
import { markdown } from './preview.js'

const NV = () => A.NV
const join = (dir, rel) => {
    if (rel.startsWith('/')) return rel.slice(1)
    const out = []
    for (const p of (dir + rel).split('/')) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p) }
    return out.join('/')
}
const dirOf = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : ''
const PROTECTED = p => /(^|\/)\.vault(\/|$)/.test(p)

export async function readBytes(v, path) {
    const parts = String(path).split('/').filter(Boolean), name = parts.pop(), folder = '/' + parts.join('/')
    await NV().ensureLoaded(v, folder)
    if (!(v.listFolder(folder) || []).some(e => e.name === name && e.type === 'file')) return null
    return new Uint8Array(await v.getFile(folder, name))
}
const readJson = async (v, p) => { const b = await readBytes(v, p).catch(() => null); if (!b) return null; try { return JSON.parse(new TextDecoder().decode(b)) } catch (e) { return null } }

/** The app a vault declares, or its index.html; null when it has neither. */
export async function appEntry(v) {
    const meta = (await readJson(v, '.vault/app.json')) || (await readJson(v, 'app.json')) || {}
    const entry = String(meta.entry || '').replace(/^\//, '') || ((await readBytes(v, 'index.html').catch(() => null)) ? 'index.html' : '')
    if (!entry || PROTECTED(entry) || !/\.html?$/i.test(entry)) return null
    const res = meta.resources || {}
    let title = meta.title || meta.name || ''
    if (!title) { const b = await readBytes(v, entry).catch(() => null); const m = b && /<title[^>]*>([^<]{1,120})<\/title>/i.exec(new TextDecoder().decode(b.subarray(0, 8192))); title = m ? m[1].trim() : '' }
    return { entry, title, css: [].concat(res.css || []), js: [].concat(res.js || []) }
}

const lit = v => JSON.stringify(v === undefined ? null : v).replace(/<\//g, '<\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

/** The script injected first in the app's <head>: window.sg, over postMessage to this page. */
function bridge(path, info) {
    return '<meta http-equiv="Content-Security-Policy" content="connect-src blob: data:">' + '<script>(function(){' +
        'var _hd=' + lit(dirOf(path)) + ';' +
        'function _err(m){try{window.parent.postMessage({type:"sg-app-error",message:String(m),appPath:' + lit(path) + '},"*")}catch(_){}}' +
        'window.onerror=function(m,s,l,c){_err(String(m)+(l?" (line "+l+(c?":"+c:"")+")":""));return false};' +
        'window.addEventListener("unhandledrejection",function(e){var r=e&&e.reason;_err("Unhandled rejection: "+String((r&&r.message)||r))});' +
        'function _id(){return (Math.random()*1e9|0).toString(36)+Date.now().toString(36)}' +
        'function _ask(req,replyKey){return new Promise(function(res,rej){var id=_id();req[Object.keys(req)[0]]=id;' +
            'function h(e){if(e.source!==window.parent||!e.data||e.data[replyKey]!==id)return;window.removeEventListener("message",h);' +
            'if(e.data.ok)res(e.data);else{var er=new Error(e.data.err||"failed");if(e.data.code)er.code=e.data.code;rej(er)}}' +
            'window.addEventListener("message",h);window.parent.postMessage(req,"*")})}' +
        'function _read(p){return _ask({__sgVfsReadReq:0,path:p},"__sgVfsReadReply").then(function(d){return d.buf})}' +
        'function _readText(p){return _read(p).then(function(b){return new TextDecoder().decode(b)})}' +
        'function _list(p){return _ask({__sgVfsListReq:0,path:p||""},"__sgVfsListReply").then(function(d){return d.entries||[]})}' +
        'function _ro(){var e=new Error("Read-only: this vault was opened with a key that came sealed to you");e.code="EROFS";return Promise.reject(e)}' +
        'function _loadCss(p){return _readText(p).then(function(c){var s=document.createElement("style");s.setAttribute("data-sg-loaded",p);s.textContent=c;document.head.appendChild(s);return s})}' +
        'function _loadJs(p){return _readText(p).then(function(j){var s=document.createElement("script");s.setAttribute("data-sg-loaded",p);s.textContent=j;document.head.appendChild(s);return s})}' +
        'window.sg={vfs:{read:_read,readText:_readText,list:_list,write:_ro,download:_ro},fs:{move:_ro,delete:_ro,mkdir:_ro},loadCss:_loadCss,loadJs:_loadJs,' +
            'on:function(){return function(){}},off:function(){},' +
            'app:' + lit({ context: 'app', selfPath: path, writable: false, ...info }) + '};' +
        'window.sgVault={writeFile:_ro,readFile:_readText,listFiles:function(){return _list("")},writable:false,selfPath:' + lit(path) + '};' +
        // vault images: set from script, or written in the page
        'var _mt=function(e){return({png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml",avif:"image/avif",ico:"image/x-icon",bmp:"image/bmp"})[e]||"application/octet-stream"};' +
        'var _rp=function(d,r){var o=[];(d+r).split("/").forEach(function(p){if(p==="..")o.pop();else if(p&&p!==".")o.push(p)});return o.join("/")};' +
        'var _d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,"src");' +
        'function _vimg(i,v){var vp=v.charAt(0)==="/"?v:("/"+_rp(_hd,v));_read(vp).then(function(b){_d.set.call(i,URL.createObjectURL(new Blob([b],{type:_mt(vp.split(".").pop().toLowerCase())})))}).catch(function(){})}' +
        'if(_d&&_d.set)Object.defineProperty(HTMLImageElement.prototype,"src",{get:_d.get,configurable:true,set:function(v){if(!v||v.indexOf(":")!==-1||v.slice(0,2)==="//"){_d.set.call(this,v);return}_vimg(this,v)}});' +
        'document.addEventListener("DOMContentLoaded",function(){[].forEach.call(document.querySelectorAll("img[src]"),function(i){var v=i.getAttribute("src");if(v&&v.indexOf(":")===-1&&v.slice(0,2)!=="//")_vimg(i,v)})});' +
        // links: another page of the vault mounts in place; the web opens after a confirm in this page
        'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a||e.defaultPrevented||a.hasAttribute("data-sg-native"))return;var h=a.getAttribute("href");if(!h)return;' +
            'if(h.charAt(0)==="#"){e.preventDefault();var el=document.getElementById(h.slice(1));if(el)el.scrollIntoView();return}' +
            'if(h.indexOf("mailto:")===0)return;' +
            'if(/^(https?:)?\\/\\//.test(h)){e.preventDefault();window.parent.postMessage({__sgOpenExternal:h},"*");return}' +
            'var hp=h.split("?")[0].split("#")[0];if(/\\.(html?|md)$/i.test(hp)){e.preventDefault();window.parent.postMessage({__sgVfsNavReq:h},"*")}},true);' +
        'window.addEventListener("message",function(e){if(e.source===window.parent&&e.data&&typeof e.data.__sgVfsScrollToHash==="string"){var f=e.data.__sgVfsScrollToHash,go=function(){var el=document.getElementById(f);if(el)el.scrollIntoView()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()}});' +
    '})();<\/script>'
}

/** The app, in a frame filling host. Returns { frame, stop }: stop() removes the page's listener. */
export async function mountApp(v, host, app, { onError = () => {}, onNav = () => {}, info = {} } = {}) {
    const frame = document.createElement('iframe')
    frame.setAttribute('sandbox', 'allow-scripts allow-forms')
    frame.setAttribute('referrerpolicy', 'no-referrer')
    frame.className = 'vault-app-frame'
    frame.title = app.title || 'the vault’s app'
    let current = app.entry
    const files = (await A.tree(v)).filter(f => !f.folder).map(f => f.path.replace(/^\//, ''))
    const fullInfo = { vaultId: v.vaultId || '', fileCount: files.length, ...info }

    async function load(path, hash = '') {
        const bytes = await readBytes(v, path)
        if (!bytes) { frame.srcdoc = `<!doctype html><meta charset="utf-8"><body style="font:15px system-ui;padding:2rem;color:#444">Not in this vault: <code>${path.replace(/[<&]/g, '')}</code></body>`; return }
        let html = new TextDecoder().decode(bytes), pre = ''
        if (/\.(md|markdown)$/i.test(path)) html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font:16px/1.6 system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1.2rem;color:#1c1d21}pre{white-space:pre-wrap}</style></head><body>${markdown(html)}</body></html>`
        if (path === app.entry) {                        // app.json's resources, inlined first, as the host does
            for (const c of app.css) { const b = await readBytes(v, join('', c)).catch(() => null); if (b) pre += `<style data-sg-preload="${c.replace(/"/g, '')}">${new TextDecoder().decode(b).replace(/<\/style/gi, '<\\/style')}</style>` }
            for (const j of app.js) { const b = await readBytes(v, join('', j)).catch(() => null); if (b) pre += `<script data-sg-preload="${j.replace(/"/g, '')}">${new TextDecoder().decode(b).replace(/<\/script/gi, '<\\/script')}<\/script>` }
        }
        const inject = bridge(path, fullInfo) + pre
        const out = html.replace(/(<head[^>]*>)/i, '$1' + inject)
        frame.srcdoc = out === html ? inject + html : out
        current = path
        if (hash) frame.addEventListener('load', () => frame.contentWindow.postMessage({ __sgVfsScrollToHash: hash }, '*'), { once: true })
        onNav(path)
    }
    const reply = (e, msg) => { try { e.source.postMessage(msg, '*') } catch (_) { /* gone */ } }
    async function onMessage(e) {
        if (e.source !== frame.contentWindow || !e.data || typeof e.data !== 'object') return
        const d = e.data
        if (d.type === 'sg-app-error') return onError(String(d.message || ''))
        if (d.__sgVfsReadReq) {
            const p = String(d.path || '').startsWith('/') ? String(d.path).slice(1) : join(dirOf(current), String(d.path || ''))
            if (PROTECTED(p)) return reply(e, { __sgVfsReadReply: d.__sgVfsReadReq, ok: false, err: 'Protected path', code: 'EPROTECTED' })
            const b = await readBytes(v, p).catch(() => null)
            if (!b) return reply(e, { __sgVfsReadReply: d.__sgVfsReadReq, ok: false, err: 'ENOENT', code: 'ENOENT', path: p })
            const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
            return reply(e, { __sgVfsReadReply: d.__sgVfsReadReq, ok: true, buf, path: p })
        }
        if (d.__sgVfsListReq) {
            const p = join(dirOf(current), String(d.path || '')).replace(/\/$/, '')
            if (PROTECTED(p)) return reply(e, { __sgVfsListReply: d.__sgVfsListReq, ok: false, err: 'EPROTECTED', code: 'EPROTECTED' })
            const pre = p ? p + '/' : ''
            const entries = [...new Set(files.filter(f => f.startsWith(pre) && !PROTECTED(f)).map(f => { const rest = f.slice(pre.length), i = rest.indexOf('/'); return i < 0 ? rest : rest.slice(0, i + 1) }))]
                .map(n => ({ name: n.replace(/\/$/, ''), path: pre + n.replace(/\/$/, ''), dir: n.endsWith('/') }))
            return reply(e, { __sgVfsListReply: d.__sgVfsListReq, ok: true, entries })
        }
        if (d.__sgVfsWriteReq) return reply(e, { __sgVfsWriteReply: d.__sgVfsWriteReq, ok: false, err: 'EROFS', code: 'EROFS' })
        if (d.__sgCmdId) return reply(e, { __sgCmdReply: d.__sgCmdId, ok: false, err: 'Not available here (read-only host)', code: 'ENOTSUP' })
        if (typeof d.__sgVfsNavReq === 'string') {
            const [p, hash = ''] = d.__sgVfsNavReq.split('#')
            const target = join(dirOf(current), p.split('?')[0])
            if (PROTECTED(target)) return
            return load(target, hash)
        }
        if (typeof d.__sgOpenExternal === 'string') {
            let u = null; try { u = new URL(d.__sgOpenExternal, location.href) } catch (_) { return }
            if (!/^https?:$/.test(u.protocol)) return
            if (confirm(`The vault’s app wants to open:\n\n${u.href}\n\nOpen it in a new tab?`)) window.open(u.href, '_blank', 'noopener,noreferrer')
        }
    }
    window.addEventListener('message', onMessage)
    host.replaceChildren(frame)
    await load(app.entry)
    return { frame, stop: () => window.removeEventListener('message', onMessage), home: () => load(app.entry), current: () => current }
}
