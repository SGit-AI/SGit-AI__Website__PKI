# Colophon

*End matter — how this book was made, and the gates it must pass*

---

This book was commissioned in a single sentence on 31 August 2026 — *sync this repo, take a look at /insurance/ and its llms.txt, and in a new base folder write a book that incorporates all the ideas in those briefs/voice-memos into a coherent book/pdf about insurance* — and the sentence is preserved verbatim in `BRIEF.md` beside the decisions the writing session added on its own authority: the title, the five-part structure, and the folder. It is the second volume from this estate, by the method of the first, and it was written by the same class of agent the corpus proposes to rate — a fact the reader is entitled to keep in view throughout.

## The sources, and their order of precedence

The memos outrank everything. Ten voice memos and a pivot briefing were filed verbatim as briefs v0.33.71 through v0.33.81 *before they were read* — transcription stumbles, mid-sentence corrections and one truncated final thought included — because a transcript outranks any summary of it. The doctrine under `/insurance/src/` is derived from the memos and names which memo each document came from; where doctrine and memo disagree, the memo wins. The audit at v0.33.82 re-read all eleven readings against their transcripts and found six defects, which chapter 17 walks. This book quotes all three layers, and quotes the estate's pre-insurance corpus where the doctrine leans on it.

## The gates

Every discipline is inherited from the first volume, and each fails the build rather than warning.

**Quotes.** Every *stated* quotation is extracted from the chapters, its source discovered rather than asserted — searched for across the briefs, the doctrine, the machine surfaces and the estate's artefacts — and re-read out of that source on every build. A quotation not found where it claims to be fails the build.

**Stats.** Every count in the prose is a `gen:stat` marker computed from the repository at build time: memo counts from the manifest, decision counts from the change-control sources, the excess from the register's own view, release spans from the tags. In check mode, a drifted count fails the build. This is the mechanised form of the audit's largest lesson, and this book watched the mechanism work: its own draft carried wrong values in several markers, and the first build corrected them.

**Figures.** Every figure is taken from the version its caption names — a `git worktree` at the tag, a one-shot server on a port used once, a headless browser killed in a `finally`. A figure of the past must re-derive at its tag; a figure of the present must match the live page, and the build fails when it stops matching, which it will on the next release. The terminal figures are real transcripts, executed by `shots/transcripts.sh` at build time, never pasted.

**Hashes and captions.** `book.json` records the SHA-256 of every chapter's markdown, and the build fails on a mismatch. Every figure carries a caption that says what to *notice*, and a caption under forty characters fails.

## The writing session's own findings

Recorded here because a colophon is where a book confesses. First: the corpus is unusually quotable because it was built to be — filing transcripts before reading them is what makes a verbatim-quote gate possible at all, and this book's <!-- gen:stat:quotes -->76<!-- /gen:stat:quotes --> verified quotations are downstream of that one filing habit. Second: the hardest structural choice was where to put the audit; it earned the closing chapter because the corpus's most distinctive property is not any position but the fact that it checked itself and published the result. Third: the book's own first build caught its own stale numbers, which is simultaneously embarrassing and the entire point — the writer who typed those numbers had read, hours earlier, an audit brief about writers typing numbers.

Set in the estate's own chrome, rendered to HTML by the site's reader and to PDF by the harness in `gen_pdf.mjs`; the PDF embeds every figure as a data URI and reads start to finish offline with no link followed. The markdown under `content/` is the source of truth. CC BY 4.0, like everything else here.
