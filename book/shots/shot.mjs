#!/usr/bin/env node
// shot.mjs <port> <jobs.json> — photograph a served site, one job at a time.
//
// Published with the book so any figure can be RE-TAKEN rather than believed.
// Three disciplines this file exists to enforce, each learned at the sibling
// estate's expense (BRIEF.md §4.1):
//
//   1. NEVER REUSE A PORT. One capture, one port, forever — the server's and
//      the browser's alike. A zombie headless browser holding a debug port
//      serves stale bytes to every later capture on it, and makes a working
//      page look broken for as long as it takes to suspect the browser
//      instead of the code. The port is passed in; travel.sh never repeats one.
//   2. ALWAYS KILL WHAT YOU SPAWNED, in a block that runs whether the capture
//      succeeded or failed. `finally`, never the happy path.
//   3. A SCREENSHOT THAT LOOKS FINE, TAKEN FROM A PAGE THAT THREW, IS A FIGURE
//      YOU MUST NOT PUBLISH. Every pageerror and console error is collected and
//      printed beside its result, and marks the job `errored`.
//
// Plus the blank check: anything under ~3% ink is a white rectangle, and white
// rectangles are easy to miss in a set of twelve.

// Resolve playwright whether it is installed beside this file or globally
// (`npm i -g playwright`). ESM ignores NODE_PATH, so a global install is
// found explicitly rather than left to fail with a confusing module error —
// this harness is published for other people to re-run.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require_ = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  ({ chromium } = require_(`${globalRoot}/playwright`));
}
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { PNG } from './png.mjs';

const [, , PORT, JOBS_PATH] = process.argv;
if (!PORT || !JOBS_PATH) {
  console.error('usage: shot.mjs <port> <jobs.json>');
  process.exit(2);
}

const spec = JSON.parse(readFileSync(JOBS_PATH, 'utf8'));
const BASE = `http://127.0.0.1:${PORT}`;
const OUTDIR = resolve(dirname(JOBS_PATH), '..', spec.outdir || 'img');
mkdirSync(OUTDIR, { recursive: true });

// Blank check. The brief's rule is "anything under about 3 per cent ink is a
// white rectangle" — but a figure of a dark terminal is ~100% ink by that
// measure, so a dark page that rendered nothing would sail through. The gate
// is therefore colour-agnostic: the fraction of pixels that are NOT the
// modal colour. A blank page of ANY colour scores ~0; a page with content
// scores well above the threshold whatever its background.
function inkFraction(pngBuffer) {
  const { width, height, data } = PNG.decode(pngBuffer);
  const total = width * height;
  const counts = new Map();
  for (let i = 0; i < total; i++) {
    // Quantise to 5 bits per channel: anti-aliasing must not read as content.
    const k = ((data[i * 4] >> 3) << 10) | ((data[i * 4 + 1] >> 3) << 5) | (data[i * 4 + 2] >> 3);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let modal = 0;
  for (const n of counts.values()) if (n > modal) modal = n;
  return (total - modal) / total;
}

let browser;
const results = [];
try {
  browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });

  for (const job of spec.jobs) {
    const scale = job.scale || 2;                       // legible in print
    const vp = job.viewport || { width: 1280, height: 900 };
    const ctx = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: scale,
      colorScheme: job.colorScheme || 'light',
    });
    const page = await ctx.newPage();

    // Collect everything the page complains about. A silent throw is the
    // failure mode this block exists to make loud.
    const problems = [];
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
    page.on('requestfailed', (r) => {
      const u = r.url();
      // A blocked third-party request is a finding about the page, not about us.
      problems.push(`requestfailed: ${u} (${r.failure()?.errorText})`);
    });

    const url = BASE + job.path;
    let status = null;
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      status = resp ? resp.status() : null;
      if (job.waitFor) await page.waitForSelector(job.waitFor, { timeout: 15000 });
      if (job.click) for (const sel of [].concat(job.click)) {
        await page.click(sel, { timeout: 15000 });
        await page.waitForTimeout(400);
      }
      if (job.evaluate) await page.evaluate(job.evaluate);
      await page.waitForTimeout(job.settle ?? 500);
    } catch (e) {
      problems.push(`navigation: ${e.message}`);
    }

    const outName = job.out || `${job.id}.png`;
    const outPath = `${OUTDIR}/${outName}`;
    let buf = null;
    try {
      if (job.selector) {
        const el = await page.locator(job.selector).first();
        await el.scrollIntoViewIfNeeded({ timeout: 10000 });
        buf = await el.screenshot({ timeout: 20000 });
      } else {
        buf = await page.screenshot({ fullPage: !!job.fullPage, clip: job.clip || undefined });
      }
      writeFileSync(outPath, buf);
    } catch (e) {
      problems.push(`screenshot: ${e.message}`);
    }

    let ink = null, digest = null, bytes = null;
    if (buf) {
      bytes = buf.length;
      digest = createHash('sha256').update(buf).digest('hex');
      try { ink = inkFraction(buf); } catch (e) { problems.push(`inkcheck: ${e.message}`); }
    }

    const blank = ink !== null && ink < 0.03;
    if (blank) problems.push(`BLANK: ink ${(ink * 100).toFixed(2)}% < 3% — this is a white rectangle`);

    const r = {
      id: job.id, path: job.path, out: outName, http: status,
      bytes, ink: ink === null ? null : +(ink * 100).toFixed(2),
      image_sha256: digest,
      ok: !!buf && !blank && problems.length === 0,
      problems,
    };
    results.push(r);
    const flag = r.ok ? 'ok  ' : (blank ? 'BLANK' : 'ERR ');
    console.log(`  ${flag} ${job.id.padEnd(26)} ${String(status).padEnd(4)} ink=${r.ink ?? '—'}%  ${bytes ?? 0}B`);
    for (const p of problems) console.log(`        ! ${p}`);

    await ctx.close();
  }
} finally {
  // Rule 2. Runs whether the capture succeeded or failed.
  if (browser) await browser.close().catch(() => {});
}

// Keyed by the JOBS FILE, not the tag: two job sets can share a tag (the
// terminal figures and the web figures are both "current"), and keying by tag
// silently overwrote one with the other.
const jobsName = JOBS_PATH.replace(/^.*\//, '').replace(/\.json$/, '');
writeFileSync(`${OUTDIR}/../.last-run-${jobsName}.json`,
  JSON.stringify({ tag: spec.tag, jobs: jobsName, port: +PORT, results }, null, 2) + '\n');

const bad = results.filter((r) => !r.ok);
console.log(`  ── ${results.length} captured, ${bad.length} with problems`);
process.exit(bad.length ? 1 : 0);
