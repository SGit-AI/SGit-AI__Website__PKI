# In-Person Public-Key Exchange on iPhone

## Purpose

Let two people standing next to each other exchange public keys and explicitly associate each received key with the person in front of them.

The user experience resembles device pairing:

1. Open the same app or website.
2. Start an exchange and accept the intended peer.
3. Exchange pending public keys.
4. Compare a matching verification number, image, or word sequence.
5. Both confirm.
6. Save the verified contact-to-key association.

Private keys are never exchanged. Physical proximity makes the interaction convenient, but does not by itself establish identity.

## 1. The core scenario

Alice and Bob meet in person. Both have the same application open.

- Alice selects **Exchange public keys**.
- Bob selects **Join exchange**.
- They connect using a native nearby-device channel or a browser pairing link.
- Each application receives the other's public key as a pending, untrusted key.
- Both screens display a verification representation bound to the same exchange.
- Alice and Bob compare their screens face to face.
- Each confirms only if the representations match.
- Once both confirmations are received, each application saves the other person's verified public key.

```text
Discover or pair
       |
Connect and exchange pending public keys
       |
Compare verification screens in person
       |
Both users explicitly confirm
       |
Save verified contact-to-key associations
```

### What “swap the keys after confirmation” means

The public keys travel before confirmation so that the verification protocol can bind the exchange to the actual keys. Confirmation changes their status from pending to trusted; it does not need to be the first moment the keys are transmitted.

### What this establishes

“I met this person and accepted this public key as theirs.”

This is a direct trust relationship. It does not require a certificate authority for that particular association, and it is not automatically a complete certificate-management infrastructure.

## 2. Native iPhone implementation

Apple's Multipeer Connectivity framework supports discovery of nearby peers, invitations, sessions, and data exchange using local wireless transports. It can provide the discovery and transport layer for the proposed native experience.

Example flow:

```text
Alice: Share / exchange                  Bob: Receive / join
           |                                      |
           +------ Discover and accept peer ------+
                              |
                   Exchange pending public keys
                              |
                    Compare verification screens
                              |
                       Both users confirm
```

Nearby discovery is not a guarantee that the other device is touching the phone, nor proof that it belongs to the intended person. The in-person verification step remains necessary.

Apple also publishes migration guidance from Multipeer Connectivity to the Network framework. Review current platform guidance before committing the production transport implementation.

### Key handling

Apple CryptoKit provides signing and signature-verification functionality. For supported key types and operations, the Secure Enclave can protect a private key on the iPhone. Choose key algorithms and storage deliberately; do not assume every algorithm supports Secure Enclave protection.

## 3. Browser implementation

The same human verification experience can be implemented in a website, but an iPhone browser does not expose the native Multipeer Connectivity framework. Safari also does not support Web Bluetooth or Web NFC.

Replace automatic nearby discovery with an explicit pairing step:

1. Both people open the website.
2. Alice creates an exchange session.
3. Alice's screen displays a short-lived pairing QR code or link.
4. Bob scans the QR code and joins the session.
5. The browsers exchange pending public keys and protocol messages.
6. Both display the verification representation.
7. Both compare and confirm in person.
8. Each saves the verified contact key.

### Transport options

| Option | Role | Considerations |
|---|---|---|
| Server-mediated exchange | Relay public keys, protocol messages, and confirmations | Straightforward starting design; do not treat relayed identity claims as automatically trustworthy |
| WebRTC data channel | Exchange application data between browsers | Requires signaling; connectivity may require a relay rather than a direct connection |
| Reciprocal QR scanning | Each phone displays its own key payload for the other to scan | Removes the need to fetch the public keys from a server; requires two scans and a defined verification flow |

A pairing QR code identifies a session. It does not prove proximity or identity. Looking at each other's screens and confirming the exchange supplies the human verification.

Browser key persistence, device migration, backup, and recovery require a separate design. Do not assume browser-held keys have the same lifecycle or hardware protection as native Secure Enclave keys.

## 4. NFC: what works and what does not

### iPhone browser

A website cannot directly read or write physical NFC tags through Web NFC on iPhone.

However, a compatible iPhone can read a URL-bearing NFC tag through the operating system. The user can tap the resulting notification to open the website. This passes a URL to the website; it does not expose the tag's raw memory or hardware identifier to JavaScript.

### Native iPhone app

A native app can use Core NFC to read compatible tags and write NDEF messages to writable tags with sufficient capacity.

Relevant APIs include:

- `NFCNDEFReaderSession`
- `connect(to:)`
- `queryNDEFStatus`
- `writeNDEF`

The word “Reader” in the session name does not mean it is read-only.

### Physical-tag key transfer

```text
Alice's iPhone writes public key to a physical tag
                         |
Bob's iPhone reads the physical tag
                         |
Alice and Bob compare the key fingerprint in person
                         |
Bob saves Alice's verified public key
```

A public key can be copied without exposing its private key. The relevant threat during enrollment is substitution: someone presenting a different public key as Alice's.

### Direct phone-to-phone NFC

Do not assume ordinary Core NFC tag reading and writing enables unrestricted iPhone-to-iPhone NFC key exchange. Apple's card-emulation and secure contactless platforms have eligibility, entitlement, and use-case restrictions.

For this project, distinguish three different operations:

- Writing a physical NFC sticker or card.
- Making an iPhone emulate a contactless card.
- Discovering and exchanging data with another nearby phone.

These are not interchangeable APIs or capabilities.

## 5. Signed NFC credentials versus cryptographic tags

A native app could sign a credential and write the credential plus signature onto an ordinary NFC tag. Verification establishes the authenticity of the signed data, not the uniqueness of the physical tag: copying the signed payload preserves its valid signature.

If the goal is authenticating the physical tag itself, use suitable cryptographic tag hardware and its supported protocol.

For example, NXP NTAG 424 DNA supports AES-based authentication and dynamic authenticated messages. It is not a general-purpose public-key challenge-signing tag. Its originality-signature feature is a separate mechanism.

For the in-person exchange proposed here, a cryptographic tag is not required merely to carry a public key.

## 6. QR-code capacity

A single standard QR code can carry up to 2,953 bytes in byte mode using Version 40 and the lowest error-correction level.

| Encoding mode | Maximum capacity at Version 40, level L |
|---|---:|
| Numeric | 7,089 digits |
| QR alphanumeric | 4,296 characters |
| Byte / binary | 2,953 bytes |

QR alphanumeric mode supports a restricted uppercase character set; it is not equivalent to arbitrary mixed-case text. UTF-8 characters can occupy multiple bytes.

### Maximum byte payload by error correction

| Level | Maximum bytes |
|---|---:|
| L | 2,953 |
| M | 2,331 |
| Q | 1,663 |
| H | 1,273 |

These are maximum-size symbols, not recommended target payload sizes. More data produces denser symbols. Keep the payload compact and test scanning on the actual phones and screen sizes.

### Suggested public-key payload

```text
protocol_version
key_algorithm
public_key
session_id
session_nonce
```

This is a conceptual field list, not a finalized wire format. Encoding wrappers, URLs, JSON field names, and Base64 all consume capacity. Whether the complete payload fits depends on the chosen key format and metadata.

A QR code can contain the public key itself, not just a server link. That lets the receiver obtain the key without downloading it from a service.

## 7. Security requirements for the proposed protocol

The scenario is a product design, not a complete cryptographic protocol specification.

Before implementation:

- Select a reviewed authenticated pairing / short-authentication-string protocol rather than inventing one.
- Bind verification to both public keys, fresh session data, and the participants' protocol roles.
- Do not simply generate a code on one phone and copy it to the other: matching displayed values alone would then prove nothing about key substitution.
- Do not assume that taking a few digits from an ordinary transcript hash automatically provides a secure pairing protocol.
- Keep keys pending until the required verification and confirmation complete.
- Handle cancellation, mismatches, timeouts, retries, and simultaneous sessions explicitly.
- Limit guessing attempts and choose verification strength appropriate to the threat model.
- Confirm possession of the corresponding private keys as part of the selected protocol when that assurance is required.
- Flag later key changes; do not silently transfer old trust to a replacement key.
- Design revocation, lost-device recovery, key rotation, and contact migration separately.
- Treat the integrity of the browser application and its delivery as part of the trust model.

## 8. Proposed starting point

For a browser-first prototype:

1. Pair with a short-lived QR session link.
2. Use a server relay for the initial transport.
3. Use a reviewed pairing protocol to authenticate the public-key exchange.
4. Compare matching representations in person.
5. Require both confirmations before saving verified contact keys.
6. Add explicit key-change and recovery behavior before production use.

For a native version, keep the same user-facing trust flow and use an appropriate nearby-device transport for discovery and messaging.

## Source material

The platform capabilities and QR limits discussed above are grounded in these sources. The proposed workflow and implementation checklist are design guidance, not claims that these sources specify the entire protocol.

- Apple: Multipeer Connectivity — https://developer.apple.com/documentation/multipeerconnectivity
- Apple: Moving from Multipeer Connectivity to Network framework — https://developer.apple.com/documentation/technotes/tn3213-moving-from-multipeer-connectivity-to-network-framework
- Apple: Core NFC Enhancements — https://developer.apple.com/videos/play/wwdc2019/715/
- Apple: Adding Support for Background Tag Reading — https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading
- Apple: CryptoKit — https://developer.apple.com/documentation/cryptokit
- Apple: Protecting keys with the Secure Enclave — https://developer.apple.com/documentation/security/protecting-keys-with-the-secure-enclave
- Apple: HCE-based contactless NFC transactions — https://developer.apple.com/support/hce-transactions-in-apps/
- Apple: NFC & SE Platform — https://developer.apple.com/support/nfc-se-platform/
- MDN: Web Bluetooth API — https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- MDN: Web NFC API — https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API
- WebRTC: Getting started with peer connections — https://webrtc.org/getting-started/peer-connections
- DENSO WAVE: QR information capacity and versions — https://www.qrcode.com/en/about/version.html
- QR capacity reference — https://www.qrcodechimp.com/qr-code-storage-capacity-guide/
- NXP: NTAG 424 DNA data sheet — https://www.nxp.com/docs/en/data-sheet/NT4H2421Gx.pdf
- NXP: NTAG 424 DNA application note AN12196 — https://www.nxp.com/docs/en/application-note/AN12196.pdf
