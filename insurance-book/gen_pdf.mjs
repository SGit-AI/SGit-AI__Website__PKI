#!/usr/bin/env node
// gen_pdf.mjs — one PDF that READS START TO FINISH OFFLINE, with no link
// followed. Every URL that matters appears in full at least once in the text,
// images are embedded as data: URIs, and nothing is fetched at render time.
//
// Built from book/content/*.md — the same markdown the HTML pages render, so
// the PDF cannot describe a chapter it did not render.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';

const require_ = createRequire(import.meta.url);
function load(name) {
  try { return require_(name); }
  catch { return require_(`${execSync('npm root -g', { encoding: 'utf8' }).trim()}/${name}`); }
}
const { chromium } = load('playwright');
const { marked } = load('marked');

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const BOOK = `${ROOT}/insurance-book`;
const book = JSON.parse(readFileSync(`${BOOK}/book.json`, 'utf8'));

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
// The positions and the provenance rule are prose with inline code spans in
// them; escape first, then turn the backticks into <code>, so `setting` reads
// as setting rather than as a stray backtick.
const escCode = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

// Images become data: URIs so the PDF is self-contained — no fetch at render
// time, and no broken figure if the file moves later.
function inline(mdDir, src) {
  const p = resolve(mdDir, src);
  if (!existsSync(p)) return null;
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
}

marked.setOptions({ mangle: false, headerIds: false });

let bodyHtml = '';
for (const c of book.chapters) {
  const mdPath = `${BOOK}/${c.file}`;
  let md = readFileSync(mdPath, 'utf8');
  let html = marked.parse(md);
  // embed every figure
  html = html.replace(/<img([^>]*?)src="([^"]+)"([^>]*)>/g, (m, a, src, b) => {
    const d = inline(dirname(mdPath), src);
    return d ? `<img${a}src="${d}"${b}>` : `<p class="figmissing">[figure unavailable: ${esc(src)}]</p>`;
  });
  bodyHtml += `<section class="chap"><div class="partline">${esc(c.part)}</div>${html}</section>`;
}

const toc = book.chapters.map((c) =>
  `<div class="tocrow"><span class="n">${esc(c.number)}</span>` +
  `<span class="t">${esc(c.title)}</span>` +
  `<span class="w">${c.words.toLocaleString()}w</span></div>`).join('');

const figtable = book.figures.map((f) =>
  `<tr><td><code>${esc(f.id)}</code></td><td><code>${esc(f.tag)}</code></td>` +
  `<td>${f.gate === 'fresh' ? 'fresh' : 're-derivable'}</td>` +
  `<td><code>${esc(f.page_sha256.slice(0, 16))}…</code></td></tr>`).join('');

const doc = `<!doctype html><meta charset="utf-8"><title>${esc(book.title)}</title>
<style>
 @page { size: A4; margin: 20mm 18mm 18mm; }
 html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
 body { font: 10.5pt/1.62 "Iowan Old Style", Georgia, "Times New Roman", serif;
        color: #1d1b17; margin: 0; }
 h1 { font-size: 19pt; line-height: 1.22; margin: 0 0 .5em; page-break-after: avoid;
      font-family: ui-sans-serif, system-ui, "Helvetica Neue", sans-serif; letter-spacing: -.01em; }
 h2 { font-size: 13pt; margin: 1.7em 0 .5em; page-break-after: avoid;
      font-family: ui-sans-serif, system-ui, sans-serif; }
 h3 { font-size: 11.2pt; margin: 1.4em 0 .4em; page-break-after: avoid;
      font-family: ui-sans-serif, system-ui, sans-serif; }
 p, li { orphans: 3; widows: 3; }
 code, pre { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
 code { font-size: .86em; background: #f2f0ea; padding: .08em .28em; border-radius: 2px; }
 pre { background: #f7f6f1; border: 1px solid #e4e0d4; border-radius: 3px;
       padding: .7em .85em; font-size: 8.1pt; line-height: 1.45; overflow: visible;
       white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }
 pre code { background: none; padding: 0; font-size: inherit; }
 blockquote { margin: 1em 0; padding: .1em 0 .1em .95em; border-left: 2.5px solid #b9b2a0;
              color: #3c3931; font-style: normal; page-break-inside: avoid; }
 table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 8.9pt;
         page-break-inside: avoid; }
 th, td { border: 1px solid #ddd8c9; padding: .34em .5em; text-align: left; vertical-align: top; }
 th { background: #f2f0e8; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 8.3pt; }
 img { max-width: 100%; height: auto; display: block; margin: .9em auto;
       border: 1px solid #e0dbcd; border-radius: 3px; page-break-inside: avoid; }
 .figmissing { color: #a33; font-size: 8.5pt; }
 hr { border: 0; border-top: 1px solid #e0dbcd; margin: 1.6em 0; }
 .chap { page-break-before: always; }
 .partline { font: 600 7.6pt/1.4 ui-sans-serif, system-ui, sans-serif; letter-spacing: .1em;
             text-transform: uppercase; color: #8a8578; margin: 0 0 1.4em; }
 .cover { page-break-after: always; padding-top: 42mm; text-align: left; }
 .cover .title { font: 700 30pt/1.12 ui-sans-serif, system-ui, sans-serif;
                 letter-spacing: -.02em; margin: 0 0 .35em; }
 .cover .sub { font: 400 13pt/1.4 ui-sans-serif, system-ui, sans-serif; color: #4a463d;
               margin: 0 0 2.2em; }
 .cover .about { font-size: 11pt; line-height: 1.6; max-width: 34em; margin: 0 0 2.4em; }
 .cover .meta { font: 9pt/1.7 ui-monospace, monospace; color: #5f5a50; }
 .warn { page-break-after: always; }
 .warn h2 { margin-top: 0; }
 .warnbox { border: 1px solid #d9c9a8; border-left: 4px solid #b08a3e; background: #fdf8ec;
            padding: .9em 1.1em; border-radius: 3px; margin: 0 0 1.2em; }
 .warnbox ol { margin: .4em 0 0; padding-left: 1.2em; }
 .warnbox li { margin: .45em 0; }
 .tocrow { display: flex; gap: .7em; align-items: baseline; padding: .17em 0;
           border-bottom: 1px dotted #e2ded1; }
 .tocrow .n { flex: 0 0 2.2em; font: 600 8.4pt ui-monospace, monospace; color: #9b9484; }
 .tocrow .t { flex: 1 1 auto; font-size: 9.6pt; }
 .tocrow .w { flex: 0 0 auto; font: 7.8pt ui-monospace, monospace; color: #9b9484; }
</style>

<div class="cover">
  <div class="title">${esc(book.title)}</div>
  <div class="sub">${esc(book.subtitle)}</div>
  <div class="about">${esc(book.about)}</div>
  <div class="meta">
    Written ${esc(book.written)} &middot; ${book.counts.chapters} chapters in five parts<br>
    ${book.counts.words_chapters.toLocaleString()} words &middot;
    ${book.counts.figures} figures &middot;
    ${book.provenance.stated_quotations} verified quotations &middot;
    ${book.provenance.drawn_claims} claims drawn by the writer<br>
    Published by the sgit project &middot; pki.sgit.ai &middot; ${esc(book.licence)}<br><br>
    This PDF reads start to finish offline. Every URL that matters<br>
    appears in full at least once in the text; no link needs following.
  </div>
</div>

<section class="warn">
<h2>Before anything else</h2>
<div class="warnbox">
<b>These positions travel inside the chapters rather than in an appendix, because a chapter
quoted in isolation must still carry them.</b>
<ol>
${book.positions_that_travel_with_every_chapter.map((p) => `<li>${escCode(p)}</li>`).join('\n')}
</ol>
</div>
<p><b>The provenance rule.</b> ${escCode(book.provenance.rule)}</p>
<h2>Contents</h2>
${toc}
<h2>The figures, and the two gates</h2>
<p>Every figure was taken from the version its caption names — a <code>git worktree</code> at the
tag, a one-shot local server on a port used once and never again, a headless browser killed in a
block that runs whether the capture succeeded or failed. A figure of a <b>past</b> version is
<b>re-derivable</b>: re-running the harness at that tag reproduces the digest, and it never goes
stale because the tag does not move. A figure of the site <b>as it stands</b> is <b>fresh</b>: the
digest must match the live page, and the build fails when it stops matching — which it will, on the
next release.</p>
<p>The three terminal figures are real transcripts, executed by the harness at build time and
photographed; each capture is recorded in <code>insurance-book/shots/shots.json</code> with its
digest, and the harness ships beside the book so any figure can be re-taken rather than believed.</p>
<table><tr><th>Figure</th><th>Tag</th><th>Gate</th><th>Page digest at that tag</th></tr>
${figtable}</table>
</section>

${bodyHtml}
`;

// The assembled source is an intermediate, not a page: keep it out of the
// served tree so the site's own validator does not treat it as one.
const scratch = process.env.TMPDIR || '/tmp';
writeFileSync(`${scratch}/pdf-source.html`, doc);

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  await page.setContent(doc, { waitUntil: 'load' });
  await page.pdf({
    path: `${BOOK}/the-delta-is-where-the-insurance-lives.pdf`,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font:7pt ui-sans-serif,system-ui,sans-serif;color:#8a8578;' +
      'padding:0 18mm;display:flex;justify-content:space-between">' +
      '<span>The Delta Is Where the Insurance Lives &middot; pki.sgit.ai &middot; CC BY 4.0</span>' +
      '<span class="pageNumber"></span></div>',
    margin: { top: '18mm', bottom: '16mm', left: '18mm', right: '18mm' },
  });
  if (problems.length) { console.error('  ! page errors:', problems); process.exitCode = 1; }
} finally {
  await browser.close().catch(() => {});
}
console.log('  the-delta-is-where-the-insurance-lives.pdf written');
