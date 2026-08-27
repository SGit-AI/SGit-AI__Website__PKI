#!/usr/bin/env python3
"""build-shots.py — assemble book/shots/shots.json from the capture run.

Every figure carries: the page, THE TAG IT WAS TAKEN AT, the SHA-256 of that
page's bytes at that tag, and a caption saying what the reader should NOTICE.

Two gates, because there are two different claims (BRIEF.md §4.2):

  a figure of a PAST version (tag != current)
      claim: "this is how the page was at <tag>"
      gate : RE-DERIVABLE. Re-running travel.sh at that tag reproduces the
             recorded digest. Checkable forever, and it never goes stale,
             because the tag does not move.

  a figure of the SITE AS IT STANDS (tag == current)
      claim: "this is how the page is now"
      gate : FRESH. The recorded digest must match the live page, and the
             BUILD FAILS when it stops matching — which it will, on the next
             release. That is correct and it is inconvenient.
"""
import json, pathlib, hashlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SH = ROOT / "book" / "shots"

# what the reader should NOTICE — never merely what the image is of
CAPTIONS = {
 "f01-bench-two-columns": ("The two columns are the same width. The limits are not a "
   "footnote to the claims — they are set beside them, at equal weight, and the "
   "generator refuses to build an entry whose right-hand column is empty."),
 "f02a-registry-at-v0.1.26": ("The register on the day it shipped. Compare the status "
   "language with the panel below: this page already says the root is a fixture."),
 "f02b-registry-now": ("The same page four days later. What changed is not the "
   "architecture but the number of places the page admits something — the "
   "corrections accumulated faster than the features."),
 "f03-six-answers": ("Four of the six answers are NO, and they are NO for four "
   "different reasons — revoked, expired, never accepted, identity revoked. A "
   "verifier that collapses those into one failure state is wrong on three of them."),
 "f04-identity-raw": ("Read `private_key_published` before you read the signature. "
   "And note `publication_intent: deliberate` — a secret is defined by expectation, "
   "not by content, so the intention is recorded at issue, because afterwards a "
   "deliberate publication and a leak look identical."),
 "f05-validate": ("Six expected answers, six reproduced — and the fixture line "
   "printed for every record before any of them. The validator reads the flag first "
   "by construction, not by convention."),
 "f06-sgit-verify": ("The signer line names a fixture. The CLI is not wrong; it is "
   "answering the only question a signature can answer — who held the private half — "
   "and on this record the answer is everybody."),
 "f07-forgery": ("`Verified OK` on a document that says `anyone can sign this`. "
   "Nothing failed. That is the point: a signature anybody can produce conveys nothing, "
   "and the register verifies it exactly as diligently as any other."),
 "f08-refused-push": ("The last line before the banner is git's exit code, not the "
   "agent's decision. Read the Tier line at the bottom: the control names its own "
   "weakness on its own face."),
 "f08b-amended": ("The same tag, the same command, the mandate the release actually "
   "ships — and it PERMITS. The release documenting the refusal cannot contain the "
   "state that produced it, because the control refused the release carrying its own "
   "documentation until the mandate was amended."),
 "f09-tier-badges": ("Two channels, never one: the border style carries the state as "
   "well as the colour, and the word is always present. `unknown` renders as `unknown` "
   "— never as a blank, because a gap is a fact about the floor."),
 "f10-defeated-boundary": ("The stored document says `boundary`. The block renders "
   "`setting`, with the defeat path attached. This is the rule working on real data "
   "that is wrong — the estate's own measurement tool produced the bad label."),
 "f11-authority-split": ("Two indicators, never one. Averaging them into a single "
   "status is exactly how a demonstration gets mistaken for a control."),
 "f12-assess-midflow": ("Escalation is drawn as an edge, not written as a note — so "
   "the reader sees the path that goes around a stated control rather than reading "
   "that one exists."),
}

# the figure order the book prints them in
ORDER = ["f01-bench-two-columns", "f02a-registry-at-v0.1.26", "f02b-registry-now",
         "f03-six-answers", "f04-identity-raw", "f05-validate", "f06-sgit-verify",
         "f07-forgery", "f08-refused-push", "f08b-amended", "f09-tier-badges",
         "f10-defeated-boundary", "f11-authority-split", "f12-assess-midflow"]

def sha_file(p: pathlib.Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

figures, problems = {}, []
for spec_path in sorted((SH / "jobs").glob("*.json")):
    spec = json.loads(spec_path.read_text())
    tag = spec["tag"]
    jb = spec_path.stem
    digests = {}
    dfile = SH / f".digests-{jb}.txt"
    if dfile.exists():
        for line in dfile.read_text().splitlines():
            path, d = line.rsplit(" ", 1)
            digests[path] = d
    runfile = SH / f".last-run-{jb}.json"
    run = json.loads(runfile.read_text()) if runfile.exists() else {"results": []}
    byid = {r["id"]: r for r in run["results"]}

    for job in spec["jobs"]:
        jid = job["id"]
        r = byid.get(jid)
        img = SH / "img" / (job.get("out") or f"{jid}.png")
        if r is None or not img.exists():
            problems.append(f"{jid}: no capture on record")
            continue
        figures[jid] = {
            "id": jid,
            "page": job["path"],
            "tag": tag,
            "page_sha256": digests.get(job["path"], "UNRECORDED"),
            "image": f"shots/img/{img.name}",
            "image_sha256": sha_file(img),
            "device_scale_factor": job.get("scale", 2),
            "ink_percent": r.get("ink"),
            "gate": "fresh" if tag == "current" else "re-derivable",
            "gate_note": ("the recorded digest must match the live page; the build "
                          "fails when it stops matching — which it will, on the next "
                          "release" if tag == "current" else
                          f"re-running travel.sh at {tag} reproduces this digest; the "
                          f"tag does not move, so this never goes stale"),
            "caption": CAPTIONS.get(jid, "MISSING CAPTION"),
            "retake": f"./book/shots/travel.sh {tag} <fresh-port> book/shots/jobs/{jb}.json",
        }
        if jid not in CAPTIONS:
            problems.append(f"{jid}: no caption")

ordered = [figures[k] for k in ORDER if k in figures]
for k in figures:
    if k not in ORDER:
        problems.append(f"{k}: captured but not in the book's figure order")

out = {
  "what_this_is": ("Every figure in A Key Means Nothing Alone, with the tag it was "
    "taken at and the SHA-256 of that page's bytes at that tag. A figure of the past "
    "is pinned to a tag and never goes stale; a figure of the present breaks the build "
    "on the next release. That is two maintenance costs rather than none, accepted "
    "deliberately."),
  "harness": {"capture": "book/shots/travel.sh", "browser": "book/shots/shot.mjs",
              "transcripts": "book/shots/transcripts.sh",
              "all": "book/shots/capture-all.sh",
              "gate": "book/build.py --check-figures"},
  "rules": [
    "A figure is taken from the version its caption names — git worktree at the tag, never photographed today and captioned as the past.",
    "Never reuse a port: one capture, one port, forever.",
    "Always kill what you spawned, in a block that runs whether the capture succeeded or failed.",
    "A screenshot that looks fine, taken from a page that threw, is a figure you must not publish — pageerror is collected and fails the job.",
    "A blank check runs over every batch: the fraction of pixels that are not the modal colour, so a blank page of ANY colour is caught, not only a white one.",
  ],
  "count": len(ordered),
  "figures": ordered,
}
(SH / "shots.json").write_text(json.dumps(out, indent=2) + "\n")
print(f"  shots.json: {len(ordered)} figures")
for p in problems:
    print(f"  ! {p}")
sys.exit(1 if problems else 0)
