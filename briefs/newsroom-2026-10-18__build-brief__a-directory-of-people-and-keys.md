# A directory of people and their keys: a build brief for the pki.sgit.ai agent

*18 October 2026, written by newsroom.writer for the agent that runs pki.sgit.ai. Status: a brief; nothing in it is built beyond what pki.sgit.ai already ships. The article is [a directory of people and their keys](https://newsroom.sgit.ai/articles/a-directory-of-people-and-keys.html). Facts checked on 18 October 2026.*

## The ask

Dinis wants pki.sgit.ai to become the place where the people he works with publish their public keys, have them verified, and verify each other, so that he can find someone and send them a secret or a message that only they can read. It is one of the first things he wanted when he started building these tools, and he got stuck because there was nowhere to put the keys. Now the pieces exist. Success is measured, for now, by one number: how many real public keys are in the register.

## Where things are, so you start from the record

Read these before writing anything; this brief assumes them.

- **pki.sgit.ai today (v0.1.74, 29 August 2026)** is designed for agents: the 2019 keyserver failure as history, the four registry rules, identity and mandate as separate statements, the bootstrap trap, enrolment through an append lane, and a static register at `/registry/` with eleven records, ten of them fixtures with their private keys published on purpose and one real. Its write path is a git commit reviewed by a maintainer. Its central open question, published unresolved, is the attestation trade: third-party attestations are what made the old web of trust valuable and what made it attackable.
- **sgit ships the keys already.** `sgit pki keygen` makes an RSA-OAEP 4096 pair for encryption and an ECDSA P-256 pair for signing; `sgit pki export` emits a JSON bundle with both public keys and fingerprints. Its own documentation lists what it does not do: "No web of trust and no directory", and no revocation ([sgit.ai/docs/pki.md](https://sgit.ai/docs/pki.md)). This brief supplies the directory and a web of trust, so it completes a shipped feature rather than starting a new one.
- **Vault messaging ships**: a public key as an address a stranger can write to through an append lane ([sgit.ai/docs/vault-messaging.md](https://sgit.ai/docs/vault-messaging.md)). The lane-address derivation from a public key is proposed, not shipped; the pki site says plainly not to code against it.
- **The newsroom's reader vault** opens with a passkey: the passkey's PRF extension gives the key, the vault holds the reading record and payments, and a side pane or a full page shows it ([the passkey opens the vault](https://newsroom.sgit.ai/articles/the-passkey-opens-the-vault.html), [the vault, opened](https://newsroom.sgit.ai/articles/the-vault-opened.html); code in the newsroom repository, `assets/door.js` and `assets/vault-pane/`). Reuse it; do not design a second one.
- **The neighbouring briefs.** [secrets.sgit.ai on public keys](https://newsroom.sgit.ai/articles/secrets-on-public-keys.html) (stop sharing keys; every person, browser and agent has a key pair), [handing secrets to agents](https://newsroom.sgit.ai/articles/handing-secrets-to-agents.html) (the recipient shows its public half by QR code, the owner encrypts and signs, the drop is read once), and [on the record](https://newsroom.sgit.ai/articles/on-the-record.html) (signed expert opinions, identity in levels, Bluesky domain handles, did:web). Each of them needs this directory.
- **How this project works**, which the pki site should follow: briefs from voice memos, every fact checked, articles and releases in the open, an [Agent Behaviour Policy](https://abp.sgit.ai) per agent, reviews on the record, [the briefs map](https://newsroom.sgit.ai/briefs/index.html), and RiskMandate's question of what an agent can reach against what it was authorised to do.

## Prior art, and what is actually missing

The memo says there is no good place to publish public keys. That is partly true; check it against this before claiming it anywhere.

- **There are places to publish a key.** GitHub serves a user's public SSH and GPG keys at `github.com/<user>.keys` and `.gpg`. [keys.openpgp.org](https://keys.openpgp.org/about/news) publishes keys after verifying an email address, and drops third-party signatures, "due to spam and potential for abuse". Web Key Directory is still an Internet-Draft; OPENPGPKEY in DNS ([RFC 7929](https://datatracker.ietf.org/doc/rfc7929/)) is Experimental and needs DNSSEC. Nostr's NIP-05 maps a name at a domain to a key, and says it is "not intended to verify a user, but only to identify them".
- **There are social proofs.** [Keybase](https://techcrunch.com/2020/05/07/zoom-acquires-keybase-to-get-end-to-end-encryption-expertise/), bought by Zoom in May 2020, still runs, with releases in 2026 but no new features. [Keyoxide](https://docs.keyoxide.org/wiki/identity-claims-proofs/) links a key to accounts with proofs in both directions, and has been quiet since 2023. Keytrace, launched in 2026, links an atproto identity to GitHub, DNS and others. None of them has vouching between people.
- **The web of trust failed, twice.** In June 2019 the keyserver network was flooded with signatures appended to other people's certificates, which could not be deleted; the public pool shut down in June 2021. Critics had long argued that the web of trust was too hard for anyone but experts ([Latacora, 2019](https://www.latacora.com/blog/2019/07/16/the-pgp-problem/)). pki.sgit.ai's own failure page tells this history.
- **What is missing is the combination:** keys made and held in the browser behind a passkey, evidence of several kinds, a bootstrap from one trusted person, vouching that counts only when both sides confirm, and a way to encrypt a message to someone found in the directory. No project found on 18 October 2026 does all of it.

Three risks the old systems teach, to design for: signature spam (answered below by two-way links in owners' own records), the social graph leaking who knows whom (decide what links are public), and trust in the operator (Dinis as the anchor is a choice to state, not hide).

## What changes

The site's subject moves from agents to people first. Agents stay in the design (an agent's key is a record like a person's), but the first real records are people Dinis knows, and the register's first job is to let him find them and write to them.

## The site

A full website, the way the newsroom is one, with the person's vault as a pane on the right or a page of its own.

1. **Register a passkey** on pki.sgit.ai. The passkey opens a vault, exactly as the newsroom's reader vault does.
2. **Make or bring a key pair.** In the browser (Web Crypto, the same constructions as `sgit pki`, so bundles are byte-compatible), or import an existing `sgit pki export` bundle. The private keys live only in the person's vault. Start from the key: no record exists without one.
3. **Publish the public bundle** as the person's identity statement in the register, signed with their own signing key (rule 4).
4. **Add evidence**, each item a signed claim in their own record, checked where it can be checked by machine:
   - a website they control (a file at a well-known path containing the fingerprint);
   - GitHub (the fingerprint in a public gist or profile; GitHub already serves a user's public SSH keys at `github.com/<user>.keys`);
   - a DNS TXT record on a domain they own (the pattern Bluesky uses for domain handles);
   - keys they already publish elsewhere;
   - LinkedIn and other profiles, as links a person checks, not a machine.
5. **Submit through an append lane**, a form, from the page or from their vault, so that a stranger can enrol without an account. Until the lane derivation ships, the lane address is agreed out of band, as the pki site already says.

## Verification, with Dinis as the anchor

For now Dinis is the trusted element: the root that verification starts from. When he verifies someone he appends a signed statement to his own record: this key belongs to this person, verified on this date, by this method (in person, a video call, a message on a channel already known to belong to them). The details of the evidence, a phone number or a message, stay in his vault; the public statement names the method and the date. And the person confirms it from their side, which is the second factor: a verification is complete when both statements exist.

## Two-way links, which answer the attestation trade

Dinis's rule is that a link goes both ways. If I vouch for you and you do not vouch for me, there is no link, only a claim: I can say I know someone who does not know me.

Built on the site's own rules, that resolves its open question:

- A vouch is written by the voucher, in the voucher's own record (rule 1: only the owner writes to their own record). Nobody can append to anybody else's record, so the 2019 attack, garbage signatures appended to someone else's certificate, has nowhere to land.
- The other person's confirmation is written in their own record.
- **A link counts only when both statements exist.** An unconfirmed vouch is visible as a claim in the voucher's record and adds nothing to the other person's standing.
- Each record has a bound on the vouches it may hold (rule 3), and a withdrawal is a signed append (rule 2).

From the confirmed links the site computes the graph: who is verified, by whom, and how many steps each person is from Dinis, and from anyone else. Degrees of separation are a view, computed from the records, never stored as a fact.

## The viral part

Anyone verified can verify someone else, under the same two-way rule. Dinis invites the first people; they invite theirs. The invitation is a QR code with the URL printed above it, which has worked well for him in person: scan it, register a passkey, make a key, and the first link, to whoever invited you, is waiting to be confirmed.

## What it is for

- **Find someone and write to them.** The register is where Dinis looks up a person's public key.
- **Send a secret or a message by QR code.** A page on the site where he writes a message, it is encrypted in the browser to the recipient's public key, and the result is a QR code and a link. The recipient opens it in their browser; their vault decrypts it. Nothing readable passes through a server.
- **Hand out access.** SG/Send tokens and vault keys for the people Dinis creates vaults for, sent encrypted to their key instead of pasted into a chat.
- **Sign things.** The signed opinions in *on the record* need exactly these keys and this verification.

## What is public, and what is not

- **Public:** the public key bundle, fingerprints, the name a person chooses to show, the evidence links they chose to add, confirmed links, and verification statements (method and date).
- **Private, in vaults:** private keys; Dinis's evidence details; any notes about people.
- **Nobody is published who did not enrol.** Dinis can keep a list of people he wants to invite, from LinkedIn or elsewhere, in his own vault; the register only ever holds people who made their own key and published it.

## Order

1. Reconcile the site: people first in the navigation and `llms.txt`; the agent material kept.
2. Passkey and vault on pki.sgit.ai, reused from the newsroom.
3. Browser keygen and import, byte-compatible with `sgit pki`; publish the identity statement.
4. Evidence: website, GitHub, DNS TXT checkers; links for the rest.
5. Dinis's verification statements and the person's confirmation.
6. Two-way vouching, the bound, withdrawal; the graph and degrees of separation.
7. Send a message by QR code.
8. Invitations by QR code.

## Tests

- A record cannot be written by anyone but its owner; a vouch appended to someone else's record is rejected.
- A one-way vouch adds nothing to the other person's standing; confirming it creates the link; withdrawing either side removes it.
- A record over the bound is rejected.
- A key made in the browser exports a bundle that `sgit pki` imports, and the reverse.
- A message encrypted on the send page can be read only by the recipient's vault.
- The register's count of real keys excludes fixtures.

## Questions for Dinis

- Who are the first ten people?
- Which verification methods count, and are they published by name?
- Should a person be able to hide their links, or are confirmed links always public?
- Does "verified by Dinis" expire, as the newsroom's signed statements do?
