# 1 · A key means nothing alone

*Part one — Why there is nothing to inherit*

---

Generating a keypair takes about four milliseconds. You can do it right now, on any machine, without asking anybody, and when it finishes you will hold a mathematical object of genuine quality: a private half nobody else has, a public half you can hand out, and a signature scheme that will not be broken by anyone reading this.

You will also have accomplished nothing.

That gap — between the ease of making a key and the difficulty of making it *mean* something — is the subject of this book, and it is why the title is not a slogan. A key means nothing alone. It becomes meaningful only when it sits inside a set of relationships that a key cannot itself establish: somebody who recognises it, something that says what its holder may do, and something that stops the holder doing more.

The industry routinely answers all three with one object.

## Three questions, and the habit of collapsing them

There are three separate questions here, and it is worth being pedantic about how separate they are, because nearly every failure this book touches comes from treating an answer to one as an answer to another.

**Who is this agent?** An identity question. It is answered by a registry — something that records that this public key belongs to this agent, in a form a third party can check. This site holds the design for that and, since v0.1.26, a running instance of it.

**What may it do?** A delegation question, and a completely different one. It is answered by a mandate: a statement, signed by an issuer, naming a subject, carrying an interval, saying that this agent may do these things until this date on this authority. Identity does not imply mandate. Knowing precisely who somebody is tells you nothing whatsoever about what they are permitted to do.

**Should that produce this effect, now, here?** An execution question, and it is not answered on this site at all. It belongs to a broker — something that sits at the point of action, holds the context the other two layers lack, and decides. The site names this layer and does not own it, at `https://pki.sgit.ai/execution/index.html`.

There is a fourth thing that is not a question but an absence, and the site states it plainly: recording who a key belongs to and what it was permitted to do leaves out the most auditable event of all — what it actually did. **The receipt is the third corner, and nothing in this book supplies it.**

Now watch what happens when the three collapse into one.

A platform token is a single object that answers all three at once and answers none of them well. It establishes identity, in the sense that a request bearing it is attributable to whoever issued it. It confers authorisation, in the sense that the request will succeed. And it performs enforcement, in the sense that a request without it will fail. One object, three jobs, and the crucial property: **its scope is knowable only to its issuer.** The holder cannot enumerate what it permits. Neither can a third party. Neither, in general, can the person who created it, six months later.

Compare a signed identity statement and a signed mandate. The site puts the distinction this way in its own front door at `https://pki.sgit.ai/llms.txt`:

> identity says this key belongs to this agent; a mandate says this agent may do these things, until this date, on whose authority. Both signed, both checkable by a third party, and the mandate revocable independently of the identity — materially different from a bearer token, whose scope is knowable only to its issuer.

*Stated.* That is the site's own framing, and it is the load-bearing claim of the whole estate: separating the statements is what makes them checkable, and checkability by a third party is the property a bearer token structurally cannot have.

## The word that does the most damage

There is a further collapse underneath the first, and it takes one word.

What an agent *can* do and what somebody *decided* it should do are different quantities. The estate calls the first a **grant** and the second a **mandate**, and Chapter 4 is entirely about why that pair of words is worth defending. The damage is done by describing the first as *implicit authorisation*.

The Grant and Mandate pack's change-control appendix records the correction, at `https://pki.sgit.ai/packs/grant-and-mandate/change-control.html`, as entry GM2, and its wording is careful:

> the mandate is authorisation (somebody decided it); the grant is **authority that nobody decided**. Calling the grant "implicit authorisation" concedes the point the vocabulary exists to make.

*Stated.* The word *implicit* smuggles in a decider. It suggests somebody weighed the thing and chose not to write it down. In almost every real case nobody weighed anything: the capability arrived bundled with a credential, as a side effect of solving delivery, and no human has ever considered it. There is no implicit authoriser. There is an absence where an authoriser would be.

And the absence is not benign, because the outside world does not care that nobody decided. The pack takes this further in the same entry, invoking a doctrine from agency law:

> And under apparent authority the outside world treats the grant as binding anyway — so *the mandate is actual authority, the grant is apparent authority, and binding regardless.*

*Stated.* This is the sharpest thing in the estate's vocabulary and it deserves unpacking, because it is what makes excess authority a live exposure rather than a tidiness complaint. Apparent authority is the principle that if a principal's conduct leads a third party reasonably to believe an agent is authorised, the principal is bound by what the agent does — whether or not the agent was actually authorised. Applied here: if your agent holds a credential that lets it write to forty-one repositories, and it writes to one you never considered, the repository does not ask whether you meant it. The commit lands. The deploy fires. The consequence is yours.

*Drawn.* The packs do not connect apparent authority to the receipt gap; reading GM2 against the execution page, the connection seems to me the reason the receipt matters more than either layer admits. If the grant binds you regardless of what you decided, then the only record that establishes what actually happened is the one nothing in this estate produces. Identity tells you whose key. Mandate tells you what was permitted. Neither tells you what was done, and it is what was done that you are accountable for.

## Why the object was never the key

Put the three questions beside the objects that answer them and the shape of the problem changes.

| Question | What answers it | What a keypair contributes |
|---|---|---|
| Who is this agent? | A registry entry somebody else agreed to | The public half, and possession of the private one |
| What may it do? | A signed mandate with an issuer and an interval | A way to sign it, and a subject to bind it to |
| Should this happen now? | A broker holding context at the point of action | Nothing |
| What did it actually do? | A receipt | Nothing |

The keypair appears in two rows out of four, and in both it is the least difficult part. Signature schemes are settled. Key lengths are settled. Nobody in this field is losing sleep over ECDSA P-256.

What is not settled is everything the keypair does not supply: a channel to somebody who will recognise the key, a document that says what its holder may do, a place to evaluate that document where the holder cannot reach it, and a record of what happened. The bootstrap trap in Chapter 3 is the first of those, and it is a loop rather than a gap. The mandate document in Chapter 4 is the second, and the estate's inventory found that nothing anywhere provides it. The third is the tier problem in Chapter 6 and it is where most real deployments quietly fail. The fourth is not in this book at all.

*Drawn.* This is the reframing I would put first if I could only carry one sentence out of the estate: **the hardest part of agent identity is not cryptography but authority choreography — the order in which claims are established.** The site states that reframing at `https://pki.sgit.ai/bootstrap/index.html` and I have not improved on it, but I would add the consequence it implies and does not say: a system can use flawless cryptography end to end and still be catastrophically weak, if its first instruction is *hand over a platform token*. Sequence is a security property. Almost nothing in the tooling treats it as one.

## What this book claims, and the size of it

The estate this book describes is a demonstration. It has a register you can fetch, a measurement tool you can run, a hook that refuses a push, and a component library that renders real documents. It has no trustworthy root, no boundary-tier enforcement point, no capability vocabulary, no receipts, no users, and one agent's worth of data.

The word *demonstration* is going to appear a lot, and it is accurate more often than it is comfortable.

So the claim is not that the problem is solved. It is narrower, and it is this: the three questions are separable, and separating them produces objects you can fetch, verify, diff, and be refused by. Part three is those objects. Whether separating them is *worth* it — whether anybody will run a registry, whether an operator will author a mandate, whether a vendor will supply the boundary — is a question about people that this estate has not asked anybody. Chapter 16 is where that gets said properly, and it is the chapter that decides whether the rest of the book can be believed.

Everything before it is the argument for why the interesting object was never the key.
