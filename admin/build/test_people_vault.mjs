#!/usr/bin/env node
/* test_people_vault.mjs: a person's vaults on pki.sgit.ai, made by the pages' own code, against a mock of the vault API.
 *
 *   node admin/build/test_people_vault.mjs
 *
 * Loads the vendored vault library the way the page does (vm.runInThisContext, one realm, VENDOR.md's order), the
 * local extension, the newsroom's module and assets/people/account.js, then against admin/build/vault-mock.mjs (the
 * newsroom's mock, copied):
 *   - the vendored files hash to what VENDOR.md records, and door.js is the newsroom's but for its one constant;
 *   - an account is made from a door's bytes: door, master and book, the access key in the master, a recovery door;
 *   - a key pair made here is kept in the master in sgit's key store layout and reads back, byte for byte;
 *   - "another device": a fresh client opens the same door and finds the same keys and the access key, with nothing typed;
 *   - the recovery code opens the same master; an unknown door is ENOVAULT;
 *   - the book keeps the record, contacts, messages, invites and notes;
 *   - the inbox: a lane made on the book, a stranger delivers a sealed message with no account (a blind ok), the owner
 *     lists it, opens it with the key from the master, and marks it read; a wrong enum key gets nothing.
 */
import vm from 'vm'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { startMock } from './vault-mock.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const VENDOR = path.join(ROOT, 'assets/vendor/sg-vault/v0.2.3')
let failed = 0
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++ }
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')

const ORDER = ['sg-send/sg-send-crypto.js', 'sg-send/sg-send.js', 'sg-vault/sg-vault-crypto.js', 'sg-vault/sg-vault-object-store.js',
    'sg-vault/sg-vault-ref-manager.js', 'sg-vault/sg-vault-commit.js', 'sg-vault/sg-vault.js', 'sg-vault/sg-vault--file-ops.js',
    'sg-vault/sg-vault--folder-ops.js', 'sg-vault/sg-vault--sync.js', 'sg-vault/sg-vault--history.js', 'sg-vault/sg-vault--branches.js']
const recorded = Object.fromEntries([...fs.readFileSync(path.join(VENDOR, 'VENDOR.md'), 'utf8').matchAll(/\| `([^`]+)` \| `([0-9a-f]{64})` \|/g)].map(m => [m[1], m[2]]))
check(ORDER.every(f => recorded[f] === sha(path.join(VENDOR, f))), 'the twelve vendored vault files hash to what VENDOR.md records')
const nr = fs.readFileSync(path.join(ROOT, 'assets/vendor/newsroom/README.md'), 'utf8')
check(new RegExp(sha(path.join(ROOT, 'assets/vendor/newsroom/newsroom-vault.js'))).test(nr), 'the newsroom’s vault module hashes to what its README records')
const doorSrc = fs.readFileSync(path.join(ROOT, 'assets/people/door.js'), 'utf8')
const normalised = doorSrc.replace(/ \* Copied from newsroom[\s\S]*?test_people_vault\.mjs checks that this copy differs in that constant only\.\n/, ' * Checked against sgit\'s own Python by passkey/vectors.json (admin/build/passkey_vectors.py).\n')
    .replace("export const RP_FOR_DERIVATION = 'pki.sgit.ai'             // pki.sgit.ai's own constants: a door here is not a newsroom door", "export const RP_FOR_DERIVATION = 'newsroom.sgit.ai'        // the constants are the site's, whichever host runs the page")
check(new RegExp(crypto.createHash('sha256').update(normalised).digest('hex')).test(nr), 'door.js is the newsroom’s, byte for byte, but for RP_FOR_DERIVATION = pki.sgit.ai')

for (const f of ORDER) vm.runInThisContext(fs.readFileSync(path.join(VENDOR, f), 'utf8'), { filename: f })
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'assets/vendor/sg-vault/local/sg-vault--create-with-id.js'), 'utf8'), { filename: 'sg-vault--create-with-id.js' })
vm.runInThisContext('globalThis.SGSend = SGSend; globalThis.SGVault = SGVault; globalThis.SGVaultCrypto = SGVaultCrypto; globalThis.SGSendCrypto = SGSendCrypto')
const A = await import(path.join(ROOT, 'assets/people/account.js'))
const K = await import(path.join(ROOT, 'assets/people/keys.js'))
const M = await import(path.join(ROOT, 'assets/people/message.js'))
const DOOR = await import(path.join(ROOT, 'assets/people/door.js'))

const mock = await startMock()
try {
    const token = mock.token
    const prf = crypto.randomBytes(32)                                   // what a passkey's PRF would give
    const door = await DOOR.doorFrom(new Uint8Array(prf))
    const sgA = A.client(token, mock.base)
    const acct = await A.createAccount({ sgSend: sgA, door, record: { kind: 'passkey', path: 'test', device: 'laptop' }, token, cloneBranch: 'dev-a' })
    check(acct.master && acct.book && /^[A-Z2-7]{26}$/.test(acct.recovery.code) && acct.doors.length === 2, 'an account is door, master and book, with a recovery door: two doors in the master')

    const me = await K.generate('Test Person')
    await A.saveIdentity(acct.master, me, { makeDefault: true })
    const second = await K.generate('Second key')
    await A.saveIdentity(acct.master, second)
    let ids = await A.identities(acct.master)
    check(ids.length === 2 && ids[0].bundle.signing_fingerprint === me.bundle.signing_fingerprint, 'two key pairs kept in the master, the default first')
    check(K.hex(ids[0].private.sign) === K.hex(me.private.sign) && K.canon(ids[0].bundle) === K.canon(me.bundle), 'and they read back byte for byte')
    const listed = await A.NV.listFiles(acct.master, `/keys/${me.bundle.fingerprint.replace(':', '_')}`)
    check(['metadata.json', 'private_key.pem', 'public_key.pem', 'signing_private.pem', 'signing_public.pem'].every(n => listed.includes(n)), 'in sgit’s key store layout: keys/sha256_<encryption fp>/ with its five files')

    // another device: a fresh client, a different clone branch, the same passkey bytes
    const sgB = A.client('', mock.base)
    const u = await A.unlock({ sgSend: sgB, door: await DOOR.doorFrom(new Uint8Array(prf)), cloneBranch: 'dev-b' })
    check(u.token === token && sgB.token === token, 'another device opens the same door and gets the access key from the master, nothing typed')
    ids = await A.identities(u.master)
    check(ids.length === 2 && ids[0].bundle.signing_fingerprint === me.bundle.signing_fingerprint, 'and the same keys: they follow the person, not the browser')
    const viaCode = await A.unlock({ sgSend: A.client('', mock.base), door: await DOOR.doorFrom(DOOR.recoveryBytes(acct.recovery.shown)), cloneBranch: 'dev-c' })
    check((await A.identities(viaCode.master)).length === 2, 'the recovery code opens the same master')
    let code = null; try { await A.unlock({ sgSend: A.client('', mock.base), door: await DOOR.doorFrom(new Uint8Array(crypto.randomBytes(32))) }) } catch (e) { code = e.code }
    check(code === 'ENOVAULT', 'an unknown door is ENOVAULT: "no door here yet", not an error')

    // the book
    const D = await import(path.join(ROOT, 'assets/people/directory.js'))
    const idSt = await D.identityStatement(me, { name: 'Test Person' })
    await A.book.addStatement(u.book, idSt)
    await A.book.addStatement(u.book, await D.evidenceStatement(me, { kind: 'link', value: 'linkedin.com/in/test', url: 'https://linkedin.com/in/test' }))
    const fresh = await A.unlock({ sgSend: A.client('', mock.base), door, cloneBranch: 'dev-d' })
    const back = await A.book.statements(fresh.book, me.bundle.signing_fingerprint)
    check(back.length === 2 && (await D.readRecord(back)).ok, 'the book keeps the person’s own statements, and they read as a clean record')
    const friend = await K.generate('Friend')
    await A.book.saveContact(fresh.book, { name: 'A friend', bundle: friend.bundle, note: 'met at OWASP' })
    await A.book.saveNote(fresh.book, friend.bundle.signing_fingerprint, 'verified on a video call, 2026-10-18')
    await A.book.saveInvite(fresh.book, { nonce: 'abcd', made: new Date().toISOString(), name: 'Friend' })
    check((await A.book.contacts(fresh.book)).length === 1 && /video call/.test(await A.book.note(fresh.book, friend.bundle.signing_fingerprint)) && (await A.book.invites(fresh.book)).length === 1, 'contacts, private notes and invitations kept in the book')

    // the inbox
    const inbox = await A.openInbox({ master: fresh.master, book: fresh.book, token, endpoint: mock.base })
    check(/^[0-9a-f]{32}$/.test(inbox.token) && (await A.readInbox(fresh.master)).enum_key === inbox.enum_key, 'an inbox is made on the book, its enum key kept in the master')
    const inboxSt = await D.inboxStatement(me, { endpoint: 'https://dev.send.sgraph.ai', vault: inbox.vault, token: inbox.token })
    check((await D.readRecord([idSt, inboxSt])).inbox.token === inbox.token, 'and its address goes into the record as an inbox statement')
    const sealed = await M.sealMessage(await M.compose({ to: me.bundle, from: friend, text: 'into your inbox' }), me.bundle, friend)
    await A.deliver({ endpoint: mock.base, vault: inbox.vault, token: inbox.token }, M.parseCode(sealed.code).enc)
    const w = await A.waiting(inbox)
    check(w.length === 1, 'a stranger delivers with the token alone, and the owner lists one waiting')
    const opened = await M.openMessage(w[0].enc, await A.identities(fresh.master), new Map([[friend.bundle.signing_fingerprint, friend.bundle]]))
    check(opened.msg.text === 'into your inbox' && opened.verified === true, 'the owner opens it with the key from the master; the sender’s signature checks')
    await A.book.saveMessage(fresh.book, 'in', { id: w[0].file_id, at: opened.msg.at, msg: opened.msg })
    await A.markRead(inbox, w[0].inbox, [w[0].file_id])
    check((await A.waiting(inbox)).length === 0 && (await A.book.messages(fresh.book, 'in')).length === 1, 'marked read, it leaves the lane; it is kept in the book')
    let refused = false; try { await A.waiting({ ...inbox, enum_key: 'f'.repeat(64) }) } catch (e) { refused = e.status === 404 }
    check(refused, 'a wrong enum key lists nothing')
} finally { await mock.close() }
console.log(failed ? `\n${failed} FAILED` : '\nall passed')
process.exit(failed ? 1 : 0)
