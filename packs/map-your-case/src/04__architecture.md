# 04 — Architecture

**pack** Map Your Case · draft-1 · 21 August 2026
**role** The page as engineering: file layout, web components without shadow DOM, one state owner, and the storage layer that treats its own absence as a first-class case.

---

## The file layout

```
assess/
  index.html        the tool — dashboard first, then the steps
  library.html      the library explorer — graph + colourised raw JSON
  library.json      the data (document 02)
  css/assess.css    all tool styles — no styles in JS, no inline style soup
  js/
    model.js        pure computation (document 03) — no DOM, no storage
    store.js        localStorage, with its failure modes handled
    graph.js        hand-rolled SVG layered DAG renderer
    scene.js        the recognition view — machine/vendor frames, reach lines
    components.js   six custom elements, no shadow DOM
    app.js          the only state owner; wires everything
    library.js      the explorer page's own logic
```

The split is a rule, not a preference: v1 shipped as one large HTML page with everything inline, and the project lead's correction memo named it directly — own folder, web components, JS and CSS separated, multiple pages. The boundaries above are the ones that made the v2 rebuild reviewable.

## Web components, no shadow DOM

Six custom elements: `sg-dashboard`, `sg-picker`, `sg-facts`, `sg-intent`, `sg-controls`, `sg-inspector`. They are **seams, not boundaries**:

- **No shadow DOM.** The site's stylesheet should reach in; the components exist to give each section a name, a render function and an event surface — not to encapsulate against their own page. Shadow roots here would buy isolation nobody asked for at the price of duplicated CSS and broken find-in-page.
- **No framework.** The house rule (same-origin, no CDN, no build step) makes React-class machinery unavailable *and* unnecessary: each component is a class with a `render(state)` method and an `emit()` helper.
- **Events up, state down.** Components dispatch bubbling `CustomEvent`s — `pick`, `fact`, `control`, `intent`, `inspect-cap`, `inspect-clear`, `copy-summary` — and never touch state or each other. `app.js` listens at the top, mutates the one state object, recomputes via the model, and re-renders down. One direction, no exceptions; every v1 "clicks appear inert" symptom traced to state living in more than one place.

## app.js: the one owner

Owns: the state object (`{products, facts, controls, intent}`), the view flag (`scene | graph`), persistence calls, and the render pass. The render pass is total — every component re-renders from current state — because at this page's size, diffing is complexity with no observable benefit.

Two of its jobs are worth naming:

- **The evidence pack.** For any inspected capability, `app.js` assembles the path rows with their evidence classes, the weakest evidence on the path, and the surface's re-run method — the dashboard's exit from trust (document 02).
- **The copy summary.** A clipboard text of the current case, built from library labels only — the sharing story until [document 09](09__sharing.md)'s fragment links ship, and constrained by the same rule: choices, never descriptions.

## The two views of the same graph

- **`scene.js` — recognition.** Draws the machine frame (or the split your-machine / vendor frame with the boundary line), the agent as a terminal/window/cloud box, asset icons, and reach lines classed open/setting/blocked with stop-circles where a boundary holds. It renders only nodes that survive the visitor's facts. It exists because a layered DAG is legible to engineers and nobody else; the scene is what a visitor recognises as *their* laptop.
- **`graph.js` — structure.** A hand-rolled SVG layered DAG: tier bars, reach-count dots, `?` markers on unverified nodes, escalation edges dashed and bowed so they read as *around*, not *through*. Hand-rolled because a chart library is a third-party request (P2) and because the diagram has exactly one layout problem, which a general library solves worse.

Both render into a `.gscroll` wrapper and size responsively (`preserveAspectRatio` plus a natural-width cap); the grid that holds them sets `min-width: 0` on children. Each of those clauses is a shipped mobile bug (document 12, lessons 5–6).

## store.js: absence is a case, not an error

One key: `pki.sgit.ai/assess/v2`. Three failure modes handled explicitly:

| Situation | Behaviour |
|---|---|
| Storage available | Load on start, save on every change — no save button, nothing to lose |
| `file:` / opaque origin | A plain-language notice: the downloaded copy cannot keep state, and why |
| Storage blocked by policy | Same notice family; the tool still works, it just forgets |

The page also renders **the raw stored bytes** on demand, with wipe and reset — demoted to a sidenote at the page's end, because v1's placement (a privacy essay before the tool) inverted the page's job. The claim "here is everything we hold" is strongest when the everything is visibly small.

## What the pages load

`index.html` and `library.html` load their own CSS and ES modules, same-origin, and nothing else. No marked, no mermaid, no fonts, no analytics. The network panel after a full assessment shows only this site — that is principle P2, checked before every release, and it is the whole reason the tool can claim what it claims.

## Invariants for future work

1. **A new section is a new component** with its own bubbling events — never a script block in the page.
2. **No component reads or writes state**; if a feature seems to need it, the feature belongs in `app.js`.
3. **Nothing new in the tool's runtime may cross the origin** — a capability that needs a server (the vault path, the exercised-set import) is a different page with its own disclosure, not an upgrade to this one.
4. **`model.js` stays DOM-free.** The moment rendering leaks in, the test harness goes blind.
5. **CSS stays in the stylesheet.** The v1→v2 rebuild's single biggest reviewability win was that design changes became diffs of one file.

---

This document is released under the Creative Commons Attribution 4.0 International licence (CC BY 4.0).
