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
SH = ROOT / "insurance-book" / "shots"

# what the reader should NOTICE — never merely what the image is of
CAPTIONS = {
 "f01-empty-seat": ("Read the excess_authority object: a grant reaching 41 resources, a "
   "mandate covering 1, and \"acceptor\": null — the register has been publishing the empty "
   "seat since before the pivot existed. The pivot is the observation that the rest of the "
   "economy has a name for whoever sits in it."),
 "f02-the-rule": ("The machine surface states the stage, the rule and the settled scale "
   "before it lists a single memo — because an agent that reads only the header must still "
   "carry them. Note what stage 1 is not: a regulated activity, a carrier, a promise to pay."),
 "f03-permit-refused": ("The same tool, two branches, two verdicts — computed from a signed "
   "mandate, dated, and reproducible by anyone with the file. A policy handshake would attach "
   "to answers of exactly this shape; nothing about the REFUSED line requires anyone to be "
   "trusted, only re-run."),
 "f04-insurance-hub": ("Ten of ten memos processed, and the count is computed from the "
   "manifest rather than typed — because this page printed a wrong count once, and the fix "
   "was a gate, not an edit. The hub also says what none of it proves, above the fold."),
 "f05-evidence-classes": ("The estate's evidence vocabulary, rendered: every block carries "
   "its tier and its evidence class, the border style carries the state as well as the "
   "colour, and unknown renders as unknown — never as a blank. The rating's two channels "
   "are this vocabulary pointed at inputs."),
 "f06-no-world-yet": ("The simulator: cards, verdicts, a board — an instrument, in memo 8's "
   "verdict, for somebody who already has the vocabulary. This estate has instruments and a "
   "card game. It has no world, and the chapter this figure sits in is the specification for "
   "one."),
 "f07-workbench": ("The control-to-premium loop already runs here: flip the branch-protection "
   "fact and the enforcement tier recomputes from the facts rather than a stored label. "
   "Rename the output and the rating's counterfactual view exists."),
 "f08-hub-at-v0.1.51": ("The hub on the day the folder shipped, preserved at its tag: one "
   "memo processed, and a series the page then believed was eight. The count later proved "
   "wrong twice — this figure is what the audit chapter's arithmetic looked like before the "
   "gate existed."),
}

# the figure order the book prints them in
ORDER = ["f01-empty-seat", "f02-the-rule", "f03-permit-refused",
         "f04-insurance-hub", "f05-evidence-classes", "f06-no-world-yet",
         "f07-workbench", "f08-hub-at-v0.1.51"]

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
            "retake": f"./insurance-book/shots/travel.sh {tag} <fresh-port> insurance-book/shots/jobs/{jb}.json",
        }
        if jid not in CAPTIONS:
            problems.append(f"{jid}: no caption")

ordered = [figures[k] for k in ORDER if k in figures]
for k in figures:
    if k not in ORDER:
        problems.append(f"{k}: captured but not in the book's figure order")

out = {
  "what_this_is": ("Every figure in The Delta Is Where the Insurance Lives, with the tag it was "
    "taken at and the SHA-256 of that page's bytes at that tag. A figure of the past "
    "is pinned to a tag and never goes stale; a figure of the present breaks the build "
    "on the next release. That is two maintenance costs rather than none, accepted "
    "deliberately."),
  "harness": {"capture": "insurance-book/shots/travel.sh", "browser": "insurance-book/shots/shot.mjs",
              "transcripts": "insurance-book/shots/transcripts.sh",
              "gate": "insurance-book/build.py --check"},
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
