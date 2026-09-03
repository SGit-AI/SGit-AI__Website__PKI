#!/usr/bin/env node
// pki.sgit.ai pre-release gate. Run from anywhere: node admin/build/validate.js
// Checks, in order:
//   1. version agreement — admin/build/version.txt vs every page's version badge,
//      the versions table, llms.txt and index.md
//   2. internal links — every relative href/src in every .html file resolves to a
//      file in the tree (fragments stripped; external and mailto links skipped)
//   3. canonical host — every <link rel="canonical"> and og:url points at the host
//      in CNAME. This site was refactored out of nhi.sgit.ai, so a canonical left
//      pointing at the old host is the specific mistake worth catching in CI.
//   4. key-leak tripwire — nothing in the tree may look like an sgit vault key
//      (a >=20-char passphrase joined by a colon to a uuid-shaped id). The site
//      discusses keys constantly; it must never contain one.
// Any failure exits 1: no tag, no publish.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const errors = [];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === '.git' || name === '.github' || name === 'node_modules' || name === '.sg_vault') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(ROOT);
// partner/src/ holds artefacts produced by somebody else, captured verbatim.
// This estate's page rules — canonical links, chrome, its version stamp — are rules
// for pages this estate wrote, and applying them to a third party's document would
// mean editing a document we do not own. What guards those files instead is stricter:
// gen_partner.js records a sha256 per artefact and fails the build if a single byte
// moves. Their links are still checked below, via the OWN pages that reference them.
const OWNED = f => !f.split(path.sep).join('/').includes('/partner/src/');
const htmlFiles = files.filter(f => f.endsWith('.html')).filter(OWNED);

// --- 1. version agreement -------------------------------------------------
const VERSION = fs.readFileSync(path.join(ROOT, 'admin/build/version.txt'), 'utf8').trim();
if (!/^v\d+\.\d+\.\d+$/.test(VERSION)) {
  errors.push(`version.txt does not carry a vX.Y.Z version: "${VERSION}"`);
}
// Since v0.1.66 the badge is filled at load time from assets/version.js — the ONE
// place a release stamps the version into something pages load — so a release no
// longer rewrites every page. A page may still carry a literal badge (pages built
// before the change, until they are next touched); if it does, the literal must
// agree. A page that carries none must load version.js, or its badge is empty forever.
const VJS = path.join(ROOT, 'assets/version.js');
if (!fs.existsSync(VJS) || !fs.readFileSync(VJS, 'utf8').includes(`"${VERSION}"`)) {
  errors.push(`assets/version.js does not carry ${VERSION} (run admin/build/chrome.py)`);
}
for (const f of htmlFiles) {
  const t = fs.readFileSync(f, 'utf8');
  if (!/<nav class="site">/.test(t)) continue;               // no chrome: a vault app, a fixture page
  const badges = [...t.matchAll(/class="ver"[^>]*>(v\d+\.\d+\.\d+)</g)].map(m => m[1]);
  for (const b of badges) if (b !== VERSION) {
    errors.push(`${path.relative(ROOT, f)}: version badge ${b} != ${VERSION}`);
  }
  if (!badges.length && !/assets\/version\.js/.test(t)) {
    errors.push(`${path.relative(ROOT, f)}: no version badge and no assets/version.js — the badge would be empty forever`);
  }
}
for (const extra of ['llms.txt', 'index.md']) {
  const t = fs.readFileSync(path.join(ROOT, extra), 'utf8');
  if (!t.includes(VERSION)) errors.push(`${extra} does not mention ${VERSION}`);
}
const versTable = fs.readFileSync(path.join(ROOT, 'admin/versions.html'), 'utf8');
if (!versTable.includes(`class="vnum">${VERSION}<`)) {
  errors.push(`admin/versions.html has no row for ${VERSION}`);
}
// each release appears exactly once — a blanket version-bump sed that touches
// the history table produces duplicates, which shipped once on the NHI site
const rows = [...versTable.matchAll(/class="vnum">(v\d+\.\d+\.\d+)</g)].map(m => m[1]);
for (const v of rows) if (rows.filter(x => x === v).length > 1) {
  errors.push(`admin/versions.html lists ${v} more than once`);
  break;
}

// --- 2. internal links ----------------------------------------------------
for (const f of htmlFiles) {
  const t = fs.readFileSync(f, 'utf8');
  const dir = path.dirname(f);
  for (const m of t.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|data:|\/\/)/.test(target) || target === '') continue;
    // A link may carry a query string. Resolve the path without it — and, for
    // the data viewer, check the document it names actually exists, so a link
    // to a moved or misspelled .json breaks the build like any other.
    const q = target.indexOf('?');
    const filePart = q === -1 ? target : target.slice(0, q);
    if (filePart && !fs.existsSync(path.resolve(dir, filePart))) {
      errors.push(`${path.relative(ROOT, f)}: broken link -> ${target}`);
      continue;
    }
    if (q !== -1) {
      const srcParam = new URLSearchParams(target.slice(q + 1)).get('src');
      if (srcParam && !fs.existsSync(path.join(ROOT, srcParam.replace(/^\/+/, '')))) {
        errors.push(`${path.relative(ROOT, f)}: data viewer points at a missing document -> ${srcParam}`);
      }
    }
  }
}

// --- 3. canonical host ----------------------------------------------------
const HOST = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
if (!/^[a-z0-9.-]+$/.test(HOST)) errors.push(`CNAME does not carry a hostname: "${HOST}"`);
for (const f of htmlFiles) {
  const t = fs.readFileSync(f, 'utf8');
  const claimed = [
    ...[...t.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)].map(m => m[1]),
    ...[...t.matchAll(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/g)].map(m => m[1]),
  ];
  for (const url of claimed) if (!url.startsWith(`https://${HOST}/`)) {
    errors.push(`${path.relative(ROOT, f)}: canonical/og:url is not on ${HOST} -> ${url}`);
  }
  // every page must declare where it canonically lives
  if (!/rel="canonical"/.test(t)) {
    errors.push(`${path.relative(ROOT, f)}: no canonical link`);
  }
}

// --- 3b. no script loaded twice -------------------------------------------
// A page that loads the same script twice fetches it twice and runs it twice.
// It is easy to introduce by hand and invisible in a diff of 150 pages, so it
// is a check rather than a habit.
for (const f of htmlFiles) {
  const t = fs.readFileSync(f, 'utf8');
  const seen = new Map();
  for (const m of t.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  }
  for (const [src, n] of seen) if (n > 1) {
    errors.push(`${path.relative(ROOT, f)}: loads ${src} ${n} times`);
  }
}

// --- 4. key-leak tripwire -------------------------------------------------
const KEY_SHAPE = /[A-Za-z0-9_-]{20,}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
for (const f of files) {
  if (/\.(png|jpg|jpeg|gif|webp|ico|woff2?|zip)$/.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  if (KEY_SHAPE.test(t)) {
    errors.push(`${path.relative(ROOT, f)}: contains a vault-key-shaped string`);
  }
}

// --- report ---------------------------------------------------------------
if (errors.length) {
  console.error(`validate: ${errors.length} error(s)`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`validate: OK — ${VERSION} on ${HOST}, ${htmlFiles.length} pages, links resolve, no key-shaped strings`);
