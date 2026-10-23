/**
 * directory.js: what a person's record says, and what the register computes from everybody's records.
 *
 * A record is a folder of signed statements, all by one key, all about that key (rule 1: only the owner writes to
 * their own record). The statement envelope is the register's own, unchanged since v0.1.x:
 *
 *     { v: 1, type, registry: "pki.sgit.ai", record, signer, created_at, body, sig }
 *
 * with record === signer === the signing fingerprint of the identity's bundle. The types a person's record uses:
 *
 *   identity     body { kind: "person" | "agent", name, bundle, about?, runtime?, session?, private_key_published }
 *                                                                                         exactly one, the first
 *   evidence     body { kind: website | github | dns | key | link, value, url? }        a claim that an account is theirs
 *   link         body { to: <fingerprint>, method?, on?, until?, policy? }               "I know the owner of that key"
 *   inbox        body { endpoint, vault, token }                                         where to write to them (an append lane)
 *   revocation   body { revokes: { record, statement }, reason, effective_from }        withdraws one of their own statements,
 *                                                                                         or the identity itself (rule 2)
 *
 * The rule that answers 2019: a link is a statement in the linker's record, never in the other person's. A LINK
 * EXISTS ONLY WHEN BOTH RECORDS HOLD ONE, EACH POINTING AT THE OTHER, NEITHER WITHDRAWN. A one-way link is a claim in
 * the claimant's record and adds nothing to the other person. A verification is a link from an anchor that names a
 * method (in person, a video call, a channel already known to be theirs); it is complete when the person links back.
 * A verification has a date and an end: `until` (yyyy-mm-dd), or a year after `on` when it names none. After it, the
 * person is linked but no longer verified, and the page asks for a re-verification: a new link statement, which
 * replaces the old one. Degrees of separation are computed from the records each time and never stored (rule: a view,
 * not a fact).
 *
 * Agents are records like people's (kind "agent"). An agent is OPERATED by a key when that key's record links to it
 * with method "operates" (and an end date: agents are verified for days or weeks, not a year) and the agent's record
 * links back (method "operated-by"): the same two-way rule. The operator can be a person, or an agent the person
 * operates (a fleet key, so that a person running hundreds of agents does not fill their own record); the chain is
 * followed up to three steps to the person at its root, whose standing the agent's page shows.
 *
 * A link to an agent can name a policy: `policy` is "sha256:<64 hex>" of the behaviour policy the operator authorises
 * it under (operates), or the agent says it runs under (operated-by). The register keeps the hash, never the text; the
 * operator's is the authorisation, the agent's a claim, and trustFrom reports both and whether they agree.
 *
 * Trust from a pinned root (trustFrom): an agent about to seal a secret must not take the register's word for who the
 * anchors are, because whoever can change the site can change anchors.json. It pins one fingerprint, given to it out of
 * band (its instructions, a DNS TXT record), builds the graph with that key as the only anchor, and asks whether the
 * recipient is the root, verified by the root, a persona of it, or an agent operated, in date, by a chain whose person
 * at the top is the root or verified by it.
 *
 * Personas are a person's other keys (for work, for a project, for a pseudonym): records of kind "person" like any other,
 * tied to the person's master key by the same two-way rule. The master's record links to the persona with method
 * "persona", and the persona's record links back with "persona-of". Either side alone is a claim; both together say
 * one person holds both keys, and the persona's page shows the master's standing, not a standing of its own. A persona
 * that wants to be verified in its own right is verified like anyone else, and that wins.
 *
 * Bounds (rule 3): 16 KiB a statement, 256 statements a record, 150 live links to people and 200 to operated agents
 * a record, 32 live evidence items.
 *
 * Pure functions over parsed JSON and keys.js; runs in the browser and in Node (admin/build/people.mjs).
 *
 * @module directory
 */
import { FP, canon, checkBundle, fingerprint, statementId, signStatement, verifyStatement } from './keys.js'

export const REGISTRY = 'pki.sgit.ai'
export const TYPES = ['identity', 'evidence', 'link', 'inbox', 'revocation']
export const BOUNDS = { statement_bytes: 16384, statements: 256, links: 150, agents: 200, evidence: 32 }
export const EVIDENCE = {
    website: { label: 'A website', machine: true, how: 'a file at https://<your domain>/.well-known/pki.sgit.ai.txt containing the proof line' },
    github: { label: 'GitHub', machine: true, how: 'a public gist, owned by your account, containing the proof line' },
    dns: { label: 'A DNS record', machine: true, how: 'a TXT record at _pki.sgit.ai.<your domain> containing the proof line' },
    key: { label: 'A key you publish elsewhere', machine: false, how: 'a URL where you already publish a key (github.com/<you>.keys, keys.openpgp.org, your site)' },
    link: { label: 'A profile', machine: false, how: 'LinkedIn or another profile: a link a person checks, not a machine' },
}
/** The verification methods an anchor may name. Published by name; the details stay in the anchor's vault. */
export const METHODS = { 'in-person': 'met in person', 'video-call': 'on a video call', 'known-channel': 'on a channel already known to be theirs', 'invitation': 'through an invitation they accepted', 'known': 'known to me',
                          'operates': 'runs this agent', 'operated-by': 'is the agent of this key',
                          'persona': 'is another key of mine (a persona)', 'persona-of': 'is a persona of this key' }
export const AGENT_DAYS = 30
export const VERIFYING = ['in-person', 'video-call', 'known-channel']
export const VERIFY_DAYS = 365
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10)
/** When a verifying link stops verifying: its own `until`, or VERIFY_DAYS after it was made. */
export const validUntil = l => l.until || plusDays(l.on || String(l.at).slice(0, 10), l.method === 'operates' ? AGENT_DAYS : VERIFY_DAYS)

/** The proof line evidence carries: the record's fingerprint, so a page, a gist or a TXT record names this key. */
export const proofLine = fp => `pki.sgit.ai=${fp}`
export const hasProof = (text, fp) => String(text || '').includes(proofLine(fp))

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x)

// ------------------------------------------------------------ writing statements (the owner, in their browser)
/** One statement, signed with the owner's key. identity = { bundle, private: { sign } }. */
export async function statement(identity, type, body, at = now()) {
    if (!TYPES.includes(type)) throw new Error(`unknown statement type ${type}`)
    const fp = identity.bundle.signing_fingerprint
    const st = await signStatement({ v: 1, type, registry: REGISTRY, record: fp, signer: fp, created_at: at, body }, identity.private.sign)
    if (new TextEncoder().encode(canon(st) + '\n').length > BOUNDS.statement_bytes) throw new Error('over the 16 KiB bound for one statement')
    return st
}
export const identityStatement = (identity, { name, about = '' }, at) =>
    statement(identity, 'identity', { kind: 'person', name: String(name).trim(), about: String(about || '').trim(), bundle: identity.bundle, private_key_published: false }, at)
/** An agent's identity: runtime says where it runs (free text), session that the key lives only as long as one session. */
export const agentStatement = (identity, { name, about = '', runtime = '', session = false }, at) =>
    statement(identity, 'identity', { kind: 'agent', name: String(name).trim(), about: String(about || '').trim(), runtime: String(runtime || '').trim(), session: !!session, bundle: identity.bundle, private_key_published: false }, at)
export const evidenceStatement = (identity, { kind, value, url = '' }, at) => statement(identity, 'evidence', { kind, value: String(value).trim(), url: String(url || '').trim() }, at)
export const POLICY = /^sha256:[0-9a-f]{64}$/
export function linkStatement(identity, { to, method = '', on = '', until = '', policy = '' }, at) {
    const body = { to, method, on }
    if (until) body.until = until
    if (policy) body.policy = policy
    return statement(identity, 'link', body, at)
}
export const inboxStatement = (identity, { endpoint, vault, token }, at) => statement(identity, 'inbox', { endpoint, vault, token }, at)
export async function withdrawStatement(identity, of, reason = 'withdrawn', at = now()) {
    return statement(identity, 'revocation', { revokes: { record: identity.bundle.signing_fingerprint, statement: typeof of === 'string' ? of : await statementId(of) }, reason, effective_from: at }, at)
}

// ------------------------------------------------------------ reading one record (anyone, anywhere)
/**
 * Check one record: every rule a statement must keep. Returns
 *   { fp, ok, problems, identity, name, bundle, statements: [{ st, id, live }], evidence, links, inbox, revoked, fixture }
 * where evidence, links and inbox are the LIVE ones (not withdrawn). `dir` is the folder's fingerprint, when known.
 */
export async function readRecord(statements, { dir = null, fixture = false } = {}) {
    const problems = [], out = { fp: dir, ok: false, problems, identity: null, name: '', bundle: null, statements: [], evidence: [], links: [], inbox: null, revoked: null, fixture: !!fixture }
    if (!Array.isArray(statements) || !statements.length) { problems.push('no statements'); return out }
    if (statements.length > BOUNDS.statements) problems.push(`${statements.length} statements: over the bound of ${BOUNDS.statements} (rule 3)`)
    const sorted = [...statements].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    const ids = sorted.filter(s => isObj(s) && s.type === 'identity')
    if (ids.length !== 1) { problems.push(ids.length ? 'more than one identity statement' : 'no identity statement: a record starts from the key'); return out }
    const idSt = ids[0], bundle = isObj(idSt.body) ? idSt.body.bundle : null
    const bp = await checkBundle(bundle)
    if (bp.length) { problems.push(...bp.map(p => 'identity: ' + p)); return out }
    const fp = bundle.signing_fingerprint
    if (dir && dir !== fp) problems.push(`the folder is ${dir} but the key is ${fp}`)
    out.fp = fp; out.bundle = bundle; out.identity = idSt; out.name = String(idSt.body.name || '')
    if (sorted[0] !== idSt) problems.push('a statement predates the identity')
    const byId = new Map()
    for (const st of sorted) {
        const where = `${st && st.type || '?'} ${st && st.created_at || ''}`.trim()
        if (!isObj(st) || st.v !== 1 || st.registry !== REGISTRY || !TYPES.includes(st.type) || !isObj(st.body) || !/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(String(st.created_at))) { problems.push(`${where}: not a register statement`); continue }
        if (st.record !== fp || st.signer !== fp) { problems.push(`${where}: written for ${st.record} by ${st.signer}, in the record of ${fp}: only the owner writes to their own record (rule 1)`); continue }
        try { if (new TextEncoder().encode(canon(st) + '\n').length > BOUNDS.statement_bytes) { problems.push(`${where}: over 16 KiB (rule 3)`); continue } }
        catch (e) { problems.push(`${where}: ${e.message}`); continue }
        if (!await verifyStatement(st, bundle.sign)) { problems.push(`${where}: the signature does not verify (rule 4)`); continue }
        const id = await statementId(st)
        const entry = { st, id, live: true }
        byId.set(id, entry); out.statements.push(entry)
        const p = shapeProblems(st, fp)
        if (p) { problems.push(`${where}: ${p}`); entry.live = false }
    }
    for (const e of out.statements) {                                       // withdrawals: of the owner's own statements only
        if (e.st.type !== 'revocation' || !e.live) continue
        const target = byId.get(e.st.body.revokes.statement)
        if (!target) { problems.push(`revocation ${e.st.created_at}: names a statement not in this record`); continue }
        if (target.st.type === 'identity') out.revoked = { at: e.st.body.effective_from || e.st.created_at, reason: e.st.body.reason || '' }
        target.live = false
    }
    const live = t => out.statements.filter(e => e.live && e.st.type === t)
    out.evidence = live('evidence').map(e => ({ id: e.id, at: e.st.created_at, ...e.st.body }))
    const lastLink = new Map()                                             // the latest live link to each key
    for (const e of live('link')) lastLink.set(e.st.body.to, { id: e.id, at: e.st.created_at, ...e.st.body })
    out.links = [...lastLink.values()]
    const inb = live('inbox'); out.inbox = inb.length ? { id: inb[inb.length - 1].id, ...inb[inb.length - 1].st.body } : null
    const toAgents = out.links.filter(l => l.method === 'operates').length
    if (out.links.length - toAgents > BOUNDS.links) problems.push(`${out.links.length - toAgents} live links: over the bound of ${BOUNDS.links} (rule 3)`)
    if (toAgents > BOUNDS.agents) problems.push(`${toAgents} operated agents: over the bound of ${BOUNDS.agents} (rule 3); use a fleet key`)
    out.kind = idSt.body.kind
    if (out.evidence.length > BOUNDS.evidence) problems.push(`${out.evidence.length} live evidence items: over the bound of ${BOUNDS.evidence} (rule 3)`)
    if (out.revoked) { out.links = []; out.inbox = null }
    out.ok = problems.length === 0
    return out
}
function shapeProblems(st, fp) {
    const b = st.body
    switch (st.type) {
        case 'identity':
            if (b.kind !== 'person' && b.kind !== 'agent') return 'identity kind must be person or agent'
            if (!String(b.name || '').trim()) return 'an identity names who or what it is'
            if (b.kind === 'agent' && (String(b.runtime || '').length > 120 || (b.session != null && typeof b.session !== 'boolean'))) return 'runtime is short text and session a boolean'
            if (String(b.name || '').length > 120 || String(b.about || '').length > 600) return 'the name or about is too long'
            if (b.private_key_published !== false && b.private_key_published !== true) return 'private_key_published must be stated'
            return null
        case 'evidence':
            if (!EVIDENCE[b.kind]) return `unknown evidence kind ${b.kind}`
            if (!String(b.value || '').trim() || String(b.value).length > 300 || String(b.url || '').length > 500) return 'evidence names what it is about, briefly'
            if (b.url && !/^https:\/\//.test(b.url)) return 'an evidence URL is https'
            return null
        case 'link':
            if (!FP.test(String(b.to))) return 'a link names a key fingerprint'
            if (b.to === fp) return 'a link to oneself'
            if (b.method && !METHODS[b.method]) return `unknown method ${b.method}`
            if (b.on && !/^\d{4}-\d\d-\d\d$/.test(b.on)) return 'on is a date, yyyy-mm-dd'
            if (b.until && (!/^\d{4}-\d\d-\d\d$/.test(b.until) || (b.on && b.until < b.on))) return 'until is a date, yyyy-mm-dd, not before on'
            if (b.policy != null && !POLICY.test(String(b.policy))) return 'a policy is named by its sha256:<64 hex>'
            return null
        case 'inbox':
            if (!/^https:\/\/[a-z0-9.-]+$/.test(String(b.endpoint)) || !/^[a-z0-9]{4,24}$/.test(String(b.vault)) || !/^[0-9a-f]{16,128}$/.test(String(b.token))) return 'an inbox is an https endpoint, a vault id and a hex append token'
            return null
        case 'revocation':
            if (!isObj(b.revokes) || b.revokes.record !== fp || !/^sha256:[0-9a-f]{64}$/.test(String(b.revokes.statement))) return 'a revocation withdraws a statement of this record, by id'
            return null
    }
    return 'unknown type'
}

// ------------------------------------------------------------ the register: everybody's records, read together
/**
 * The graph from read records: { people: Map(fp → record), edges: [[a, b, {ab, ba}]], claims: [{from, to, link}],
 *   degrees: Map(fp → n) from the anchors, via: Map(fp → fp) (one shortest path's previous hop),
 *   verified: Map(fp → { by, method, on, at, until }), expired: Map(fp → the same, for verifications past their end) }.
 * asOf (yyyy-mm-dd, default today) is the day verifications are judged on.
 * Only records that read cleanly, are not revoked, and (unless includeFixtures) are not fixtures take part.
 */
export function graph(records, { anchors = [], includeFixtures = false, asOf = today() } = {}) {
    const people = new Map()
    for (const r of records) if (r.ok && !r.revoked && (includeFixtures || !r.fixture)) people.set(r.fp, r)
    const linkOf = (a, b) => (people.get(a) && people.get(a).links.find(l => l.to === b)) || null
    const edges = [], claims = [], adj = new Map([...people.keys()].map(k => [k, new Set()]))
    for (const [a, r] of people) for (const l of r.links) {
        if (!people.has(l.to)) { claims.push({ from: a, to: l.to, link: l, reason: 'not in the register' }); continue }
        const back = linkOf(l.to, a)
        if (!back) { claims.push({ from: a, to: l.to, link: l, reason: 'not confirmed' }); continue }
        adj.get(a).add(l.to)
        if (a < l.to) edges.push([a, l.to, { ab: l, ba: back }])
    }
    const live = anchors.filter(a => people.has(a))
    const degrees = new Map(), via = new Map(), queue = []
    for (const a of live) { degrees.set(a, 0); queue.push(a) }
    while (queue.length) {
        const x = queue.shift()
        for (const y of adj.get(x)) if (!degrees.has(y)) { degrees.set(y, degrees.get(x) + 1); via.set(y, x); queue.push(y) }
    }
    const verified = new Map(), expired = new Map()
    for (const a of live) for (const y of adj.get(a)) {
        const l = linkOf(a, y)
        if (!l || !VERIFYING.includes(l.method)) continue
        const v = { by: a, method: l.method, on: l.on || l.at.slice(0, 10), at: l.at, until: validUntil(l) }
        if (v.until >= asOf) { const prev = verified.get(y); if (!prev || prev.until < v.until) verified.set(y, v) }
        else if (!expired.has(y) || expired.get(y).until < v.until) expired.set(y, v)
    }
    for (const y of verified.keys()) expired.delete(y)
    // agents: operated when the operator's link names "operates" and is in date, and the agent links back
    const operated = new Map(), lapsed = new Map()
    for (const [a, r] of people) for (const l of r.links) {
        const ag = people.get(l.to)
        if (l.method !== 'operates' || !ag || ag.kind !== 'agent' || !adj.get(a).has(l.to)) continue
        const back = linkOf(l.to, a)
        const v = { by: a, on: l.on || l.at.slice(0, 10), at: l.at, until: validUntil(l), policy: l.policy || '', claimed_policy: (back && back.policy) || '' }
        if (v.until >= asOf) { if (!operated.has(l.to) || operated.get(l.to).until < v.until) operated.set(l.to, v) }
        else if (!lapsed.has(l.to) || lapsed.get(l.to).until < v.until) lapsed.set(l.to, v)
    }
    for (const y of operated.keys()) lapsed.delete(y)
    // personas: the master links with "persona", the persona links back with "persona-of"; both people, both live
    const personas = new Map()
    for (const [a, r] of people) for (const l of r.links) {
        const p = people.get(l.to), back = linkOf(l.to, a)
        if (l.method !== 'persona' || !p || p.kind !== 'person' || r.kind !== 'person' || !back || back.method !== 'persona-of') continue
        personas.set(l.to, { of: a, on: l.on || l.at.slice(0, 10), at: l.at })
    }
    return { people, edges, claims, adj, degrees, via, verified, expired, operated, lapsed, personas, anchors: live, asOf }
}
/** The steps between two people, through confirmed links only: [a, …, b], or null. */
export function path(g, a, b) {
    if (!g.adj.has(a) || !g.adj.has(b)) return null
    const prev = new Map([[a, null]]), q = [a]
    while (q.length) {
        const x = q.shift()
        if (x === b) break
        for (const y of g.adj.get(x)) if (!prev.has(y)) { prev.set(y, x); q.push(y) }
    }
    if (!prev.has(b)) return null
    const out = []; for (let x = b; x != null; x = prev.get(x)) out.unshift(x)
    return out
}
/** The operators above an agent, nearest first, up to three steps: [fp, …]; the last is the root. */
export function operators(g, fp) {
    const out = []
    for (let x = fp, i = 0; i < 3 && g.operated.has(x); i++) { x = g.operated.get(x).by; if (out.includes(x)) break; out.push(x) }
    return out
}
/** What the register says about one person (or agent), in words the page shows. */
export function standing(g, fp) {
    const rec = g.people.get(fp)
    if (rec && rec.kind === 'agent') {
        const op = g.operated.get(fp)
        if (op) {
            const chain = operators(g, fp), root = chain[chain.length - 1], rs = standing(g, root)
            const trusted = g.people.get(root) && g.people.get(root).kind === 'person' && ['anchor', 'verified'].includes(rs.level)
            return { level: trusted ? 'operated' : 'agent', text: `an agent operated by ${chain.map(x => nameOf(g, x)).join(', operated by ')}; confirmed ${op.on}, valid until ${op.until}${trusted ? '' : ` (whose own standing: ${rs.level})`}`, ...op, chain, root, trusted }
        }
        const x = g.lapsed.get(fp)
        if (x) return { level: 'expired', text: `an agent operated by ${nameOf(g, x.by)} until ${x.until}: to be confirmed again`, ...x }
        // say which side is missing: an agent that names no operator, or one whose operator has published no link back
        const named = (rec.links || []).filter(l => l.method === 'operated-by').map(l => l.to)
        if (!named.length) return { level: 'listed', text: 'an agent in the register, not confirmed by an operator: it names no operator (node pki-agent.mjs operator <fp>, then its submission)' }
        return { level: 'listed', text: `an agent in the register, not confirmed by an operator: it names ${named.map(x => nameOf(g, x)).join(', ')} as its operator, and the register holds no "operates" link back (if one was signed, it is not published yet)`, named }
    }
    if (g.anchors.includes(fp)) return { level: 'anchor', text: 'an anchor: verification starts here' }
    const v = g.verified.get(fp)
    if (v) return { level: 'verified', text: `verified by ${nameOf(g, v.by)}, ${METHODS[v.method]}, on ${v.on}; valid until ${v.until}`, ...v }
    const pa = g.personas && g.personas.get(fp)
    if (pa && !(g.personas.has(pa.of))) {                                  // one level: a persona of a persona is not followed
        const ms = standing(g, pa.of)
        return { level: 'persona', text: `a persona of ${nameOf(g, pa.of)}, who holds both keys (their standing: ${ms.text})`, ...pa, master: pa.of, masterLevel: ms.level, trusted: ['anchor', 'verified'].includes(ms.level) }
    }
    const x = g.expired && g.expired.get(fp)
    if (x) return { level: 'expired', text: `verified by ${nameOf(g, x.by)} on ${x.on}; expired on ${x.until}: to be verified again`, ...x, degree: g.degrees.get(fp) }
    if (g.degrees.has(fp)) return { level: 'linked', text: `${g.degrees.get(fp)} step${g.degrees.get(fp) === 1 ? '' : 's'} from an anchor, through confirmed links`, degree: g.degrees.get(fp) }
    if (g.people.has(fp)) return { level: 'listed', text: 'in the register, not yet linked to an anchor' }
    return { level: 'absent', text: 'not in the register' }
}
/**
 * Whether `fp` is trusted from a pinned root, for sealing a secret to it. g must be built with anchors: [root] and
 * nothing else. Returns { ok, why, chain (fp … root), until?, policy?, claimed_policy?, policy_agrees? }.
 */
export function trustFrom(g, fp, root) {
    if (!FP.test(String(root || ''))) return { ok: false, why: 'no root pinned' }
    if (!g.people.has(root)) return { ok: false, why: `the pinned root ${root} is not in the register (or its record does not read, or is revoked)` }
    if (g.anchors.length !== 1 || g.anchors[0] !== root) return { ok: false, why: 'the graph was not built from the pinned root alone' }
    if (fp === root) return { ok: true, why: 'the pinned root itself', chain: [root] }
    const rec = g.people.get(fp)
    if (!rec) return { ok: false, why: `${fp} is not in the register (or its record does not read, or is revoked)` }
    const s = standing(g, fp)
    const viaRoot = person => person === root || (g.verified.has(person) && g.verified.get(person).by === root)
    if (rec.kind === 'agent') {
        if (s.level !== 'operated' && s.level !== 'agent') return { ok: false, why: s.text }
        const top = s.root
        if (!g.people.get(top) || g.people.get(top).kind !== 'person' || !viaRoot(top)) return { ok: false, why: `${s.text}; the person at the top of the chain is neither the root nor verified by it` }
        const op = g.operated.get(fp)
        return { ok: true, why: s.text, chain: [fp, ...s.chain, ...(top === root ? [] : [root])], until: op.until, policy: op.policy, claimed_policy: op.claimed_policy, policy_agrees: !op.policy || !op.claimed_policy || op.policy === op.claimed_policy }
    }
    if (s.level === 'verified' && s.by === root) return { ok: true, why: s.text, chain: [fp, root], until: s.until }
    if (s.level === 'persona' && viaRoot(s.master)) return { ok: true, why: s.text, chain: [fp, s.master, ...(s.master === root ? [] : [root])] }
    return { ok: false, why: `${s.text}: not verified by the pinned root` }
}
export const nameOf = (g, fp) => (g.people.get(fp) && g.people.get(fp).name) || fp
/** One-way links pointing at someone: the claims they can confirm by linking back. */
export const waitingFor = (g, fp) => g.claims.filter(c => c.to === fp && c.reason === 'not confirmed')
/** The number to watch: real keys in the register (fixtures excluded, revoked excluded). */
export const realKeys = records => records.filter(r => r.ok && !r.fixture && !r.revoked && r.identity && r.identity.body.kind === 'person').length
/** Agents' keys, counted apart: they are many, cheap, and short-lived. */
export const realAgents = records => records.filter(r => r.ok && !r.fixture && !r.revoked && r.identity && r.identity.body.kind === 'agent').length

/** A submission: the statements a person hands to the register, in one file. */
export const SUBMISSION = 'pki.sgit.ai/submission/v1'
export function submission(statements) { return { kind: SUBMISSION, record: statements[0] && statements[0].record, statements } }
/** Several submissions in one file (an operator's link and the agent's record, say), for one `people.mjs add`. */
export const SUBMISSIONS = 'pki.sgit.ai/submissions/v1'
export const submissions = subs => ({ kind: SUBMISSIONS, submissions: subs })
export { fingerprint, statementId }
