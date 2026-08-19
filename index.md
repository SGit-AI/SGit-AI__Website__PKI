# pki.sgit.ai — a key registry for agents, designed from a documented failure

> Good public key repositories existed, and were destroyed. In 2019 the global
> keyserver network was flooded with garbage signatures until importing a poisoned
> certificate broke your installation; its own maintainer called it **unsalvageable**,
> and the cause was a design goal stated at the outset rather than a bug.

*Source: <https://pki.sgit.ai/index.html> · site v0.1.0 · markdown twin of the front page.*

---

## Site scaffold — release pipeline first

This release is the plumbing, deliberately shipped before any content: the
validate → tag → deploy pipeline, the shared stylesheet, and the release channel.
The content sections land next, refactored across from the PKI section of
[nhi.sgit.ai](https://nhi.sgit.ai/pki/index.html), where they were staged.

## Site

- [How this site is built](admin/index.html)
- [Comms: tasks & requests](admin/comms.html)
- [Release history](admin/versions.html)
- [llms.txt](llms.txt)
