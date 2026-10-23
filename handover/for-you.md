# Agents and vault keys: what you do

Four recipes, for you, Dinis: the person whose key is the root (`sha256:db7f79fdd87e030a`). The agents' side of each is in [handover.md](../handover.md), which you give them; this page is yours. In every recipe a key travels sealed to the key that should open it, and you carry an image.

## 1. Give an agent a vault key you hold {#give}

You have the key (an agent sealed it to you); another agent needs it. It does not need to be enrolled for this.

1. **Ask the agent for its key.** Paste into its session: *Read https://pki.sgit.ai/handover.md. If you have no key, make one. Then run `node pki-agent.mjs keyqr --out key.png` and give me the image and your fingerprint.*
2. **Paste its key image on the QR desk**: at the top of [Your account](../account/index.html), [Your vault](../vault/index.html) or [pki.sgit.ai/m/](../m/index.html) (or choose or drop it), with your vault open. The page recognises a key and switches into a **key exchange**.
3. **Confirm the fingerprint.** Compare it, character for character, with the one the agent printed, and press **Yes, it matches**. (No: stop, give it nothing.)
4. **Choose what to give:** a vault key from a message you kept, or press **Bring the message that carries a vault key** and choose that message's QR image. Or your own public key, so it can seal things to you.
5. **Press "Seal it and make the QR code"**, then **Copy the image** (or Download PNG), and **Copy the line**.
6. **Give both to the agent:** the image, and the line (*Open this with `node pki-agent.mjs open <image> --save <folder>`. The sender is me, sha256:db7f79fdd87e030a.*).

**To send it a message** the same way: in step 4 choose **A message I write**, type it, and carry the image; the agent opens it with `node pki-agent.mjs open <image>`. Press **Keep … in my contacts** after step 3, and next time [Send](../send/index.html) lists the agent: write, then **QR code for an agent (JSON)**, with no key image needed.

Keep the messages that carry vault keys in your book (**Keep it in my book**, when you open one): then they are in the list in step 4, and you do not need the image again.

The vault key is sealed again in your browser's memory: it is not shown, not downloaded, not pasted. Only the agent's key opens the image, for seven days.

## 2. Onboard a new agent {#onboard}

Once per agent. After this, other agents trust it on their own, and keys move between agents without you checking fingerprints by hand.

1. **Paste into its session:** *Read https://pki.sgit.ai/handover.md, section C. Run `node pki-agent.mjs operator sha256:db7f79fdd87e030a` and `node pki-agent.mjs submission`, and give me the JSON and your fingerprint.*
2. **In [Your vault → Agents](../vault/index.html#agents)**, paste the JSON and press **Check it**. Compare the fingerprint with the one the agent printed.
3. **Choose how long:** a week for a session agent; a month for one whose key lasts (the vault registry, once its key is kept as a secret). Add its behaviour policy if it has one. **Sign.**
4. **Press Copy it** and give the file to the site's agent (the session that runs pki.sgit.ai). It checks every signature, publishes, and the register shows the agent as operated by you.

An agent's key that lives only as long as its session dies with it. For an agent that must keep keys (the registry), give it a key that lasts: in its session, `SG_SEND_PASSPHRASE=… node pki-agent.mjs keyfile`, and keep the output and the passphrase as secrets of its environment (`PKI_AGENT_KEY`, `SG_SEND_PASSPHRASE`).

## 3. Have one agent hand a vault key to another {#agent-to-agent}

Both enrolled (recipe 2). You see nothing; you carry an image.

1. **Tell the agent that has the key:** *Seal the vault key of &lt;vault&gt; to sha256:&lt;recipient&gt;, following https://pki.sgit.ai/handover.md, section A.* Add your own fingerprint after a comma (`--to <recipient>,sha256:db7f79fdd87e030a`) when you want a copy you can open too.
2. **Carry each image** to the session it is for. The receiving agent checks the signature, that the sender chains to your root, and the date, and stores it (section B).

## 4. Receive a key yourself {#receive}

On the QR desk ([Your account](../account/index.html), [Your vault](../vault/index.html) or [pki.sgit.ai/m/](../m/index.html)), with your vault open, choose, drop or paste the image, several images, or a zip of them. Each message for your key opens, one under the other. A file that looks like a key stays closed until you press View. A sender not in the register is shown as such: compare its fingerprint with the one the agent gave you.

## What needs you {#todo}

Your account's Home and your vault open with **To do**: an agent that says you operate it and is not confirmed yet, a confirmation that ends within a week, what you signed that is not in the register yet (**Copy for the register**, then give it to the site's agent), and vault keys you kept but have not passed on. One button each.

## What to check, every time {#check}

- **The fingerprint**, against the one the agent printed in its own session. Not against one in a message, a QR code or a page someone sent you.
- **The sender**, on what you open: signed, and by whom.
- **The date**: a sealed key expires in seven days; an older image is refused.
- **Never paste a vault key into a chat**, yours or an agent's. If an agent prints one, treat that vault as exposed, and rekey it (`sgit vault rekey`).
