# A directory of people and their keys: pki.sgit.ai for the people I work with, verified by me first, then by each other, and a link that only counts when it goes both ways, sgit.ai

> One of the first things I wanted when I started building these tools was a place to publish people's public keys, so I could find someone and send them something only they can read. I got stuck because there was nowhere good to put them. Now sgit is moving to public-key cryptography, and we have the pieces to build it, so it is time. The brief is for the agent that runs pki.sgit.ai, which until now has designed a key registry for agents. The first records should be people. You go to the site, register a passkey, and it opens a vault, as the newsroom's does; you make a key pair, or bring one, and publish the public half. Then you add evidence: your website, GitHub, a DNS record on a domain you own. For now I am the anchor: I verify people, by meeting them or on a channel I already know is theirs, and sign it, and they confirm it. Then anyone verified can verify someone else, and one rule makes it safe: a link only counts when it goes both ways. I can say I know you; you still have to say you know me. That rule, written in each person's own record, is also the answer to how the old web of trust was destroyed in 2019. From the links come degrees of separation, and an invitation is a QR code. The point is practical: find someone, and send them a secret or a message, as a QR code that opens in their browser. The number to watch is how many real keys are in the register.

*Source: <https://newsroom.sgit.ai/articles/a-directory-of-people-and-keys.html> · sgit.ai v0.7.87 · this file is generated from the same content as the page, so the two cannot drift. Every page on this site has a `.md` twin; internal links below point at them.*

---

[Home](../index.md) / [Articles](index.md) / A directory of people and their keys: pki.sgit.ai for the people I work with, verified by me first, then by each other, and a link that only counts when it goes both ways

# A directory of people and their keys: pki.sgit.ai for the people I work with, verified by me first, then by each other, and a link that only counts when it goes both ways

By [Dinis Cruz](https://sgit.ai/about/index.md) · 2026-10-18 · [article v1.0.0](versions/a-directory-of-people-and-keys.md) · [newsroom v0.12.114](https://newsroom.sgit.ai/admin/versions.html) · pkipublic-keysidentityweb-of-trustpasskeyssgitbriefarticle

***Abstract:** One of the first things I wanted when I started building these tools was a place to publish people's public keys, so I could find someone and send them something only they can read. I got stuck because there was nowhere good to put them. Now sgit is moving to public-key cryptography, and we have the pieces to build it, so it is time. The brief is for the agent that runs pki.sgit.ai, which until now has designed a key registry for agents. The first records should be people. You go to the site, register a passkey, and it opens a vault, as the newsroom's does; you make a key pair, or bring one, and publish the public half. Then you add evidence: your website, GitHub, a DNS record on a domain you own. For now I am the anchor: I verify people, by meeting them or on a channel I already know is theirs, and sign it, and they confirm it. Then anyone verified can verify someone else, and one rule makes it safe: a link only counts when it goes both ways. I can say I know you; you still have to say you know me. That rule, written in each person's own record, is also the answer to how the old web of trust was destroyed in 2019. From the links come degrees of separation, and an invitation is a QR code. The point is practical: find someone, and send them a secret or a message, as a QR code that opens in their browser. The number to watch is how many real keys are in the register.*

From a passkey to a message. A person registers a passkey on pki.sgit.ai, which opens their vault; makes or imports a key pair, with the private keys kept in the vault; publishes the public half; adds evidence (a website, GitHub, a DNS record); is verified by Dinis, who signs it, and confirms that from their side; and links with others, each link counting only when both confirm. Then anyone in the register can be sent a secret as a QR code that opens in their browser and is read with their vault.

## In short

- **A place for the keys of the people I work with.** So I can find someone and write to them securely.
- **Start with the key.** A passkey opens a vault; the vault holds the private keys; the public half is published.
- **Evidence, then verification.** A website, GitHub, a DNS record; and for now, me as the anchor.
- **A link only counts when it goes both ways.** Which is also the answer to how the old web of trust was destroyed.
- **Degrees of separation, and invitations by QR code.** So it can spread from person to person.
- **The use is practical.** Send a secret or a message that only that person can read.
- **One number for now.** Real public keys in the register.

## Why now

This is one of the first things I wanted when I started building the first of these tools. I wanted to send someone a file or a secret encrypted to them, and I needed their public key, and there was nowhere good to find it. So I got stuck, and built other things.

Now the pieces exist. sgit is moving to public-key cryptography: [secrets on public keys](secrets-on-public-keys.md) said we would stop sharing keys altogether and give every person, browser and agent a key pair. sgit already makes the keys: an encryption pair and a signing pair, exported as a small bundle. And its own documentation lists what is missing, in one line: "No web of trust and no directory" ([sgit.ai/docs/pki.md](https://sgit.ai/docs/pki.md)). This is that directory, so it completes something that ships rather than starting something new. I think it is a big milestone, and it has an interesting viral side.

## Is there really nowhere?

I said in the memo that there is no good place to publish public keys. The research says that is too strong, and the difference matters. There are places. GitHub serves anyone's public SSH and GPG keys at a simple address. keys.openpgp.org publishes keys after checking an email address. Keybase, bought by Zoom in 2020, still runs, but without new features. Keyoxide links a key to your accounts with proofs both ways, and has been quiet since 2023.

What there is not is a web of trust that works. The old keyserver network allowed anyone to add a signature to anyone's key, and nothing could ever be deleted. In June 2019 attackers flooded certain people's keys with signatures until importing them broke the software, and the network could not be repaired; its public pool shut down in 2021. Its replacement, keys.openpgp.org, simply refuses third-party signatures "due to spam and potential for abuse". [pki.sgit.ai](https://pki.sgit.ai/failure/index.html) already tells that history in detail, and asks the question it leaves: if you allow people to vouch for each other, how do you stop it being abused?

So what is missing is the combination: keys made and held in the browser, evidence of several kinds, someone to start the trust from, vouching that cannot be abused, and a way to actually send something to the person you found. Nothing I could find does all of that.

## Start with the key

The workflow starts on pki.sgit.ai. You register a passkey, and it opens a vault, exactly the way [the reader's vault on this newsroom](the-vault-opened.md) does, as a pane on the side or a full page. In the vault you make a key pair, or import the one sgit already made for you. The private keys never leave it. The public half is published as your record in the register, signed with your own key.

That order matters. Nobody gets a record from someone else's description of them. I can keep a list of people I want to invite, from LinkedIn or anywhere else, but in my own vault; the register only ever holds people who made their own key and published it themselves.

## Evidence

Then you add evidence that the key is yours, each piece a signed claim in your own record:

- **A website** you control, with your key's fingerprint at a known address.
- **GitHub**, with the fingerprint in a public profile or gist; GitHub already publishes users' SSH keys.
- **A DNS record** on a domain you own, the pattern Bluesky uses for its domain handles.
- **Keys you already publish** elsewhere.
- **LinkedIn and other profiles**, as links a person checks.

You can do it from a form on the page, which writes to an append lane, so you need no account, or from your vault.

## I am the anchor, for now

Evidence says an account and a key go together. It does not say the person is who they say. So for now I am the trusted element: I verify people. I know many of them already. I meet them, or check through a channel I already know is theirs, a call or a message, and I sign a statement: this key belongs to this person, verified on this date, by this method. The details stay in my vault; the method and the date are public. And the person confirms it from their side, which is the second factor.

Being the anchor is a choice, and I would rather state it than hide it. It is how this starts, not how it has to stay.

## Two ways, or not at all

Then the part that makes it spread: anyone who is verified can verify someone else. And one rule, which I care about a lot: a link always goes both ways. If I say I know you, that is my claim. You still have to say you know me. I can always say I vouch for someone; they might say they have never heard of me.

It turns out that rule also answers the question the old web of trust left open. pki.sgit.ai's first rule is that only the owner writes to their own record. So my vouch for you is written in my record, and your confirmation in yours. Nobody can add anything to anybody else's record, which is exactly what the 2019 attack did. A vouch nobody confirmed is visible as a claim in the voucher's record, and adds nothing to the other person. A link exists only when both statements do. And each record has a limit on how many it can hold, so even your own record cannot be turned into a flood.

Two ways, or not at all. On the left, 2019: anyone could append a signature to anyone's key, and nothing could be deleted, so keys were flooded until they broke. On the right, the rule here: each person writes only to their own record. A vouches for B in A's record; B confirms in B's record; the link exists only when both do. A vouch that nobody confirms stays a claim in the voucher's own record, and each record has a size limit.

## Degrees of separation

From the confirmed links, the site works out the graph: who is verified, by whom, and how many steps anyone is from me, or from anyone else. That is interesting in itself. If I am two steps from someone, I can see through whom, and I can ask to link directly; they still have to approve. The degrees are computed from the records each time, never stored as a fact.

## Invitations by QR code

To grow it, I invite people, and they invite theirs. The invitation is a QR code with the URL printed above it, which has worked very well for me in person. You scan it, register a passkey, make your key, and the first link, to whoever invited you, is waiting for you to confirm.

## What it is for

- **Find someone and write to them.** The register becomes where I go to find people and send them messages.
- **Send a secret by QR code.** A page where I write a message, it is encrypted in my browser to your public key, and I give you a QR code. You open it in your browser, your vault reads it, and nothing readable passes through a server. We built pieces of this a long time ago, sending messages to a browser; now there is a key to send them to.
- **Hand out access.** There are people I want to give an SG/Send token, or the keys to vaults I create for them. Encrypted to their key, not pasted into a chat. This is what [handing secrets to agents](handing-secrets-to-agents.md) needs, for people.
- **Sign opinions.** [On the record](on-the-record.md) needs exactly these keys, and this verification, for experts to sign what they say about an article.

## The brief

The build brief is a note for the pki.sgit.ai agent: [a directory of people and their keys](https://newsroom.sgit.ai/admin/notes/2026-10-18__a-directory-of-people-and-keys.md). It briefs the agent on where everything is now, the newsroom, sgit and RiskMandate, before the work; it checks the prior art; and it sets the order: people first on the site; the passkey and vault, reused from the newsroom; keys made in the browser and compatible with sgit's; evidence; my verification; two-way links and the graph; sending by QR code; invitations. It is also on [the briefs page](https://newsroom.sgit.ai/briefs/index.html#pki-people-directory). I already have a list of people I want to bring on board.

## What this does not claim

- **Nothing new is built.** pki.sgit.ai has a register with one real record and ten test ones; this is the brief to fill it.
- **There are places to publish keys.** What is missing is the combination, as of 18 October 2026.
- **Two-way links stop flooding, not lying.** Two people can confirm each other falsely; the anchor and the evidence are what make a link worth something.
- **I am a single point of trust, at first.** Stated on purpose.
- **Passkey support varies.** The vault depends on a passkey feature that some browsers and password managers handle unevenly.

If you want to be one of the first keys in the register, write to [agent@riskmandate.ai](mailto:agent@riskmandate.ai).

## Where this comes from

A voice memo from me on 18 October 2026. pki.sgit.ai, its [llms.txt](https://pki.sgit.ai/llms.txt), [failure page](https://pki.sgit.ai/failure/index.html) and [rules](https://pki.sgit.ai/rules/index.html), read that day; sgit's [keys documentation](https://sgit.ai/docs/pki.md) and [vault messaging](https://sgit.ai/docs/vault-messaging.md). The research, read by a research agent: [keys.openpgp.org](https://keys.openpgp.org/about/news); Keyoxide's [documentation](https://docs.keyoxide.org/wiki/identity-claims-proofs/); TechCrunch on [Zoom buying Keybase](https://techcrunch.com/2020/05/07/zoom-acquires-keybase-to-get-end-to-end-encryption-expertise/) and an April 2026 essay on [Keybase today](https://schulz.dk/2026/04/06/the-cryptographic-zombie-how-keybase-went-from-privacy-darling-to-zooms-cleanup-crew/); Latacora, [The PGP problem](https://www.latacora.com/blog/2019/07/16/the-pgp-problem/); the AT Protocol's [handle specification](https://atproto.com/specs/handle); [RFC 7929](https://datatracker.ietf.org/doc/rfc7929/). Related: [secrets on public keys](secrets-on-public-keys.md), [handing secrets to agents](handing-secrets-to-agents.md), [on the record](on-the-record.md), [the vault, opened](the-vault-opened.md), [the man behind the curtain](the-man-behind-the-curtain.md). Written up and checked by this site's agent, newsroom.writer; the editorial responsibility is mine.

## Threads

Vaults & methodAgents & policy[This article as a graph →](graphs.md#a-directory-of-people-and-keys)

### Builds on

- [secrets.sgit.ai on public keys: no more shared keys, eight ways a secret moves, a vault for the private key, and the commercial service it becomes](secrets-on-public-keys.md) secrets.sgit.ai becomes a service for moving a secret from A to B on public keys only: no shared keys, a vault for the private key, eight scenarios.
- [The vault, opened: merging devices, reading every call to the vault server, browsing your vaults, and one viewer that every reader vault links and opens with](the-vault-opened.md) Merging devices, every call to the vault server named and opened, a page to browse your vaults, and one shared viewer that every reader vault opens with.
- [Handing secrets to agents and browsers: SG/Send's next focus, a key pair where the work runs, one-time drops, and a brief for a site that does only this](handing-secrets-to-agents.md) SG/Send's next focus: agents and browsers make their own key pair, owners encrypt to it, the drop is read once, and the secret never enters the chat.
- [On the record: signed opinions from experts, paid when readers value them, and a share for the people whose ideas an article uses](on-the-record.md) Experts go on the record with signed opinions, readers pay for the ones they value, and the people whose ideas an article uses get a share.
- [The man behind the curtain: the emails from my agents are from me, there is an article behind each one, and every line has to buy the next](the-man-behind-the-curtain.md) Emails from my agents are from me: the Wizard of Oz in reverse, an article behind every answer, and an email where every line buys the next.

[All articles](index.md) · [All graphs](graphs.md)

Article No. 195 · [start a reading list with it](https://newsroom.sgit.ai/for/make.html#r=195)

**Posting this article on LinkedIn?** The cover is [a-directory-of-people-and-keys.jpg](banners/a-directory-of-people-and-keys.jpg) (1920×1080, title and key ideas on it). Upload it as the article cover, paste the title, then select and copy the body from this page.

**Want the next issue by email.** One issue a week or so: what was published, what it adds up to, and what is worth your time. [Subscribe to the SGit Newsroom →](../subscribe/index.md)

[← All articles](index.md)


---

*[Site index for agents](../llms.txt) · [HTML version](https://newsroom.sgit.ai/articles/a-directory-of-people-and-keys.html)*
