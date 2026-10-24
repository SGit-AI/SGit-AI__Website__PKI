#!/usr/bin/env node
/**
 * release_lib.mjs: pki.sgit.ai's code for other sites, released like software. Five modules (keys, message, directory,
 * delegation, sso) that import only each other, by relative path, so one folder is always one version.
 *
 * Three levels, and one rule: anything named latest moves; everything else is written once and never changed.
 *   v0         a release: breaking changes; nothing is promised between releases
 *   v0.2       a major: best effort not to break, and it may
 *   v0.2.27    a minor: small changes. An exact version: written once (a different file under the same version is
 *              refused: bump the version). manifest.json lists every file's bytes, sha256 and SRI sha384.
 *   lib/v0/v0.2/latest/   the newest 0.2.x        lib/v0/latest/   the newest 0.x        lib/latest/   the newest of all
 *   lib/index.json         every exact version with its hashes, and where each channel points
 *   <exact>/notes/release.md, security.md   from admin/lib/next.md (its "## Release notes" and "## Security"), with the
 *                          files changed since the last version (sha256 before and after) and the ones carried over
 *
 * A new exact version is made only when the code changed: a site release that leaves these files alone makes none.
 * Each manifest is signed with the site agent's key when it is here (manifest.json.sig, as `sgit pki sign` writes),
 * and the register's page for that key is how anyone checks it.
 *
 *   node admin/build/release_lib.mjs            release (from admin/build/version.txt)
 *   node admin/build/release_lib.mjs --check    exit 1 when lib/ is stale, or an exact version was changed
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawnSync } from 'child_process'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const SRC = path.join(ROOT, 'assets/people'), LIB = path.join(ROOT, 'lib')
const FILES = ['keys.js', 'message.js', 'directory.js', 'delegation.js', 'sso.js']
const check = process.argv.includes('--check')
const version = fs.readFileSync(path.join(ROOT, 'admin/build/version.txt'), 'utf8').trim()
const m = /^v(\d+)\.(\d+)\.(\d+)$/.exec(version); if (!m) { console.error(`release_lib: version ${version} is not vMAJOR.MINOR.PATCH`); process.exit(1) }
const [maj, min] = [`v${m[1]}`, `v${m[1]}.${m[2]}`]
const hashOf = b => ({ bytes: b.length, sha256: crypto.createHash('sha256').update(b).digest('hex'), sri: 'sha384-' + crypto.createHash('sha384').update(b).digest('base64') })
const read = f => fs.readFileSync(f)
const current = Object.fromEntries(FILES.map(f => [f, hashOf(read(path.join(SRC, f)))]))
const same = (a, b) => FILES.every(f => a[f] && b[f] && a[f].sha256 === b[f].sha256)
const dirOf = v => { const [, a, b] = /^v(\d+)\.(\d+)\./.exec(v); return path.join(LIB, `v${a}`, `v${a}.${b}`, v) }
const indexF = path.join(LIB, 'index.json')
const chanDir = ch => ch === 'latest' ? path.join(LIB, 'latest') : ch.split('.').length === 1 ? path.join(LIB, ch, 'latest') : path.join(LIB, ch.split('.')[0], ch, 'latest')
const LEVELS = { release: 'vN: breaking changes; nothing is promised between releases', major: 'vN.M: best effort not to break, and it may', minor: 'vN.M.P: small changes; each is written once and never changed', latest: 'any folder named latest moves to the newest version under it; everything else is immutable' }
const index = fs.existsSync(indexF) ? JSON.parse(fs.readFileSync(indexF, 'utf8')) : { versions: [], channels: {} }
const problems = []

// every exact version still holds what its manifest says: they are immutable
for (const e of index.versions) for (const f of FILES) {
    const p = path.join(dirOf(e.version), f)
    if (!fs.existsSync(p) || hashOf(read(p)).sha256 !== e.files[f].sha256) problems.push(`lib: ${e.version}/${f} was changed or removed after release: exact versions are immutable`)
}
for (const e of index.versions) for (const [n, h] of Object.entries(e.notes || {})) {
    const p = path.join(dirOf(e.version), 'notes', n)
    if (!fs.existsSync(p) || hashOf(read(p)).sha256 !== h) problems.push(`lib: ${e.version}/notes/${n} was changed after release: notes are part of the version`)
}
const last = index.versions[index.versions.length - 1]
const needNew = !last || !same(last.files, current)
if (check) {
    if (needNew) problems.push(`lib: assets/people changed since ${last ? last.version : 'no release'}: run node admin/build/release_lib.mjs`)
    for (const [ch, v] of Object.entries(index.channels || {})) {
        const e = index.versions.find(x => x.version === v)
        const d = chanDir(ch)
        for (const f of FILES) if (!e || !fs.existsSync(path.join(d, f)) || hashOf(read(path.join(d, f))).sha256 !== e.files[f].sha256) problems.push(`lib: the ${ch} channel does not hold ${v}/${f}`)
    }
    if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
    console.log(`lib: ${index.versions.length} version(s), latest ${last.version}`); process.exit(0)
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }

function writeFolder(dir, entry, channel) {
    fs.mkdirSync(dir, { recursive: true })
    for (const f of FILES) fs.copyFileSync(path.join(dirOf(entry.version), f), path.join(dir, f))
    const manifest = { v: 1, kind: 'pki.sgit.ai/lib/v1', version: entry.version, ...(channel ? { channel, moves: true } : { immutable: true }), levels: LEVELS, released: entry.released,
        base: `https://pki.sgit.ai/${path.relative(ROOT, dir)}/`, files: entry.files,
        importmap: { imports: { 'pki/': `https://pki.sgit.ai/${path.relative(ROOT, dirOf(entry.version))}/` }, integrity: Object.fromEntries(FILES.map(f => [`https://pki.sgit.ai/${path.relative(ROOT, dirOf(entry.version))}/${f}`, entry.files[f].sri])) } }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    const s = spawnSync('node', [path.join(ROOT, 'agents/pki-agent.mjs'), 'sign', path.join(dir, 'manifest.json')], { encoding: 'utf8' })
    if (s.status !== 0) console.warn(`lib: ${path.relative(ROOT, dir)}/manifest.json not signed (no agent key here): ${(s.stderr || '').trim().slice(0, 120)}`)
}
/** The exact version's notes: what admin/lib/next.md says, and what changed, worked out here. next.md is then emptied. */
function writeNotes(dir, entry, prev) {
    const nextF = path.join(ROOT, 'admin/lib/next.md'), text = fs.existsSync(nextF) ? fs.readFileSync(nextF, 'utf8') : ''
    const section = name => { const m = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm').exec(text); return m ? m[1].trim() : '' }
    const changed = FILES.filter(f => !prev || !prev.files[f] || prev.files[f].sha256 !== entry.files[f].sha256), kept = FILES.filter(f => !changed.includes(f))
    const table = ['| File | Before | After |', '|---|---|---|', ...changed.map(f => `| \`${f}\` | ${prev && prev.files[f] ? '`' + prev.files[f].sha256.slice(0, 16) + '…`' : 'new'} | \`${entry.files[f].sha256.slice(0, 16)}…\` |`)].join('\n')
    const head = `# ${entry.version}${prev ? `, after ${prev.version}` : ''}\n\nReleased ${entry.released}. Every file's full sha256 and SRI hash are in ../manifest.json.\n\n`
    fs.mkdirSync(path.join(dir, 'notes'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'notes/release.md'), head + `## Changed\n\n${table}\n\n${kept.length ? `Carried over unchanged from ${prev.version}: ${kept.map(f => '`' + f + '`').join(', ')}.\n\n` : ''}## Notes\n\n${section('Release notes') || '(none written)'}\n`)
    fs.writeFileSync(path.join(dir, 'notes/security.md'), head + `## Security\n\n${section('Security') || 'No security-relevant change in this release.'}\n`)
    fs.writeFileSync(nextF, '## Release notes\n\n## Security\n')
}
let entry = last
if (needNew) {
    const dir = dirOf(version)
    if (index.versions.some(e => e.version === version) || fs.existsSync(dir)) { console.error(`lib: ${version} is already released with other files: bump admin/build/version.txt`); process.exit(1) }
    entry = { version, released: new Date().toISOString().slice(0, 10), files: current }
    fs.mkdirSync(dir, { recursive: true })
    for (const f of FILES) fs.copyFileSync(path.join(SRC, f), path.join(dir, f))
    writeNotes(dir, entry, last)
    entry.notes = Object.fromEntries(['release.md', 'security.md'].map(n => [n, hashOf(read(path.join(dir, 'notes', n))).sha256]))
    index.versions.push(entry)
    writeFolder(dir, entry, null)
    console.log(`lib: released ${version}`)
} else console.log(`lib: assets/people unchanged since ${last.version}: no new version, channels refreshed`)
// channels: the latest exact version of each line
const latestOf = pre => [...index.versions].reverse().find(e => e.version.startsWith(pre + '.'))
const chans = { latest: entry.version, [maj]: latestOf(maj).version, [min]: latestOf(min).version }
for (const ch of ['latest', maj, min]) writeFolder(chanDir(ch), index.versions.find(e => e.version === chans[ch]), ch === 'latest' ? 'latest' : `${ch}/latest`)
fs.writeFileSync(path.join(LIB, 'README.md'), `# pki.sgit.ai/lib: the code other sites use\n\nThree levels, and one rule: **anything named \`latest\` moves; everything else is written once and never changed.**\n\n| Level | Example | Promise |\n|---|---|---|\n| release | \`v0\` | breaking changes: nothing is promised between releases |\n| major | \`v0.2\` | best effort not to break, and it may |\n| minor | \`v0.2.28\` | small changes; an exact version, never changed after release |\n\nChannels: \`lib/latest/\` (the newest of all), \`lib/vN/latest/\`, \`lib/vN/vN.M/latest/\`. Exact versions: \`lib/vN/vN.M/vN.M.P/\`, each with \`manifest.json\` (every file's sha256 and SRI hash, an import map with integrity, signed: \`manifest.json.sig\`) and \`notes/release.md\`, \`notes/security.md\`.\n\nFor code that must not change under you, pin an exact version and its hashes. A \`latest\` folder is a choice to take every change.\n\nNewest: ${chans.latest}. Every version and its hashes: [index.json](index.json).\n`)
index.channels = { ...(index.channels || {}), ...chans }
index._about = 'pki.sgit.ai code for other sites. Anything named latest moves; everything else is written once. Written by admin/build/release_lib.mjs.'
index.levels = LEVELS
fs.writeFileSync(indexF, JSON.stringify(index, null, 2) + '\n')
