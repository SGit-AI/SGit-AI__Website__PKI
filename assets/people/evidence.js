/**
 * evidence.js: checking a piece of evidence by machine, from the browser. Each check looks for the proof line
 * (pki.sgit.ai=<record fingerprint>, directory.js proofLine) where the evidence says it is:
 *
 *   dns       a TXT record at _pki.sgit.ai.<domain>, read over DNS-over-HTTPS (Cloudflare, then Google), both of
 *             which answer a browser (CORS); the pattern Bluesky uses for domain handles
 *   github    a public gist owned by the account, read from api.github.com, which answers a browser; the gist's
 *             owner must be the account named, so a gist by someone else proves nothing
 *   website   https://<domain>/.well-known/pki.sgit.ai.txt; a site that does not send CORS headers cannot be read
 *             from a browser, and the check says so rather than failing it
 *
 * A check returns { ok: true | false | null, detail }; null is "could not be checked from here", never "false".
 *
 * @module evidence
 */
import { proofLine, hasProof } from './directory.js'

const domainOf = v => String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
export const where = (kind, value, fp) => {
    const d = domainOf(value)
    if (kind === 'dns') return { place: `TXT record at _pki.sgit.ai.${d}`, content: proofLine(fp) }
    if (kind === 'website') return { place: `https://${d}/.well-known/pki.sgit.ai.txt`, content: proofLine(fp) }
    if (kind === 'github') return { place: `a public gist owned by github.com/${String(value).replace(/^@/, '')}, its URL given as the evidence URL`, content: proofLine(fp) }
    return null
}
export async function check(ev, fp) {
    try {
        if (ev.kind === 'dns') {
            const name = `_pki.sgit.ai.${domainOf(ev.value)}`
            for (const u of [`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`]) {
                try {
                    const r = await fetch(u, { headers: { accept: 'application/dns-json' } })
                    if (!r.ok) continue
                    const j = await r.json()
                    const txt = (j.Answer || []).map(a => String(a.data || '').replace(/"\s*"/g, '').replace(/^"|"$/g, '')).join('\n')
                    return hasProof(txt, fp) ? { ok: true, detail: `${name} carries the proof line` } : { ok: false, detail: (j.Answer || []).length ? `${name} has TXT records, none with ${proofLine(fp)}` : `no TXT record at ${name}` }
                } catch (e) { /* the next resolver */ }
            }
            return { ok: null, detail: 'no DNS-over-HTTPS resolver answered' }
        }
        if (ev.kind === 'github') {
            const user = String(ev.value || '').replace(/^@/, '').trim().toLowerCase()
            const id = (/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]{20,40})/.exec(ev.url || '') || [])[1]
            if (!id) return { ok: false, detail: 'the evidence URL is not a gist' }
            const r = await fetch(`https://api.github.com/gists/${id}`, { headers: { accept: 'application/vnd.github+json' } })
            if (!r.ok) return { ok: r.status === 404 ? false : null, detail: `GitHub answered ${r.status}` }
            const j = await r.json()
            if (String(j.owner && j.owner.login).toLowerCase() !== user) return { ok: false, detail: `the gist belongs to ${j.owner && j.owner.login}, not ${user}` }
            const text = Object.values(j.files || {}).map(f => f.content || '').join('\n')
            return hasProof(text, fp) ? { ok: true, detail: `a gist by ${user} carries the proof line` } : { ok: false, detail: `the gist by ${user} does not contain ${proofLine(fp)}` }
        }
        if (ev.kind === 'website') {
            const u = `https://${domainOf(ev.value)}/.well-known/pki.sgit.ai.txt`
            let r
            try { r = await fetch(u, { cache: 'no-store' }) } catch (e) { return { ok: null, detail: `${u} could not be read from a browser (the site sends no CORS header, or is down): open it yourself` } }
            if (!r.ok) return { ok: false, detail: `${u} answered ${r.status}` }
            return hasProof(await r.text(), fp) ? { ok: true, detail: `${u} carries the proof line` } : { ok: false, detail: `${u} does not contain ${proofLine(fp)}` }
        }
        return { ok: null, detail: 'a person checks this kind' }
    } catch (e) { return { ok: null, detail: String(e && e.message || e) } }
}
