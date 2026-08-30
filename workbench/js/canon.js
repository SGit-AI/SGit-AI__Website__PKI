/* pki.sgit.ai workbench — canonical form and signature verification.

   The canonical form is the registry's, byte for byte: recursively key-sorted
   compact JSON with the `sig` field removed, plus a trailing newline — the
   trailing newline because the reference implementation pipes through
   `jq -cS 'del(.sig)'` and jq terminates its output. Verified byte-identical
   against jq before this file was written; a canonical form that is merely
   "equivalent" verifies nothing. */

export function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

function b64ToBytes(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

function pemToDer(pem) {
  return b64ToBytes(pem.replace(/-----[A-Z ]+-----/g, ''));
}

/* Signature: raw r||s (64 bytes), ECDSA P-256 / SHA-256 — the registry's
   Web Crypto interop format. Returns true/false/null; null means the check
   could not run (no key, no crypto.subtle on an insecure origin), which is
   not the same answer as "forged" and must never be rendered as one. */
export async function verifySig(doc, signPem) {
  if (!doc || !doc.sig || !signPem) return null;
  if (!globalThis.crypto || !crypto.subtle) return null;
  try {
    const key = await crypto.subtle.importKey('spki', pemToDer(signPem),
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const { sig, ...rest } = doc;
    const msg = new TextEncoder().encode(canon(rest) + '\n');
    const raw = b64ToBytes(sig);
    if (raw.length !== 64) return false;
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, raw, msg);
  } catch {
    return false;
  }
}
