# pki.sgit.ai — a register of people and their keys, verified both ways

> Find someone and send them something only they can read. A passkey opens a vault that
> holds your keys (the same keys `sgit pki` makes); you publish the public half, add
> evidence, are verified by an anchor, and link with the people you know. A link only
> counts when it goes both ways, which is also the answer to how the old web of trust was
> destroyed in 2019.

*Source: <https://pki.sgit.ai/index.html> · site v0.2.5 · markdown twin of the front page.*

---

## From a passkey to a message

1. **A passkey opens a vault.** Its PRF output derives a door vault; the door holds the key of a
   master vault, which holds your private keys; so the keys follow you to every device whose
   passkey, or recovery code, opens a door. The newsroom's design, reused. [Your vault](vault/index.html)
2. **Make a key pair, or bring sgit's.** RSA-OAEP 4096 and ECDSA P-256, made in the browser,
   byte-compatible with `sgit pki` in both directions.
3. **Publish the public half**, signed with your own key.
4. **Add evidence**: a website, GitHub, a DNS record (`pki.sgit.ai=sha256:<record>` as the proof line),
   keys elsewhere, profiles.
5. **Be verified by the anchor** (Dinis Cruz, for now): a link from him naming the method and the
   date; you confirm by linking back.
6. **Link with the people you know.** A link counts only when both wrote it. Degrees of separation
   are computed from the confirmed links, never stored.
7. **Write to anyone in the register**: a message sealed in your browser to their key, as a link and
   a QR code (`pki.sgit.ai/m/#m1.…`), or into their inbox (an append lane). [Send](send/index.html)

Invitations are QR codes with the URL printed above them, signed by the inviter. [Invite](invite/index.html)

## Two ways, or not at all

| | The keyserver network, 2019 | This register |
|---|---|---|
| Where a vouch for you is written | On your key, by anyone | In the voucher's own record |
| Can a stranger grow your record? | Without limit | No (rule 1, rule 3) |
| What an unconfirmed vouch does | Counts | Nothing: a visible claim |
| Withdrawing | Never | A signed append (rule 2) |

Two-way links stop flooding, not lying; the anchor and the evidence make a link worth something.

## The number to watch

Real public keys in the register, fixtures excluded: [the register](people/index.html). Machine-readable:
[directory/index.json](directory/index.json) (generated; the signed statements in `directory/records/` are the source).

## What this site was

From August to October 2026 it designed a key registry for agents. The rules carry over; the rest is
kept in [the archive](archive/index.html), with [the old front page](archive/front-2026-08.html).
