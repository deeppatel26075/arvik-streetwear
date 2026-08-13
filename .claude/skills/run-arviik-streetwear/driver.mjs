#!/usr/bin/env node
// Driver for the ARVIIK Next.js storefront. Requires the dev server
// already running at BASE_URL (default http://localhost:3000).
//
// Usage:
//   node driver.mjs nav <path> [--out shot.png] [--viewport 390x844] [--full]
//   node driver.mjs check <path> [--viewport 390x844]
//   node driver.mjs console <path>
//
// "nav"     navigates + screenshots. Prints console errors it saw.
// "check"   navigates, scrolls the whole page (triggers lazy images),
//           then reports: horizontal-overflow offenders (elements wider
//           than their own parent, ignoring intentional horizontal-scroll
//           regions) and any <img> with naturalWidth 0 (broken image).
//           This is the check that actually catches things dev-mode's
//           `overflow-x:hidden` safety net hides from a plain
//           document.scrollWidth comparison — see Gotchas in SKILL.md.
// "console" navigates and just dumps browser console output.

import { chromium } from 'playwright';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function parseArgs(argv) {
  const [cmd, target, ...rest] = argv;
  const opts = { out: 'shot.png', viewport: '390x844', full: false };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--out') opts.out = rest[++i];
    else if (rest[i] === '--viewport') opts.viewport = rest[++i];
    else if (rest[i] === '--full') opts.full = true;
  }
  const [width, height] = opts.viewport.split('x').map(Number);
  return { cmd, target, opts, width, height };
}

async function withPage({ width, height }, fn) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 768,
    hasTouch: width < 1024,
  });
  const page = await context.newPage();
  const consoleMsgs = [];
  page.on('console', (msg) => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));
  try {
    await fn(page, consoleMsgs);
  } finally {
    await browser.close();
  }
}

// Element-level overflow check. document.scrollWidth vs clientWidth is
// NOT enough here — this project sets overflow-x:hidden on html/body as
// a safety net, which clips overflowing content without registering as
// scrollWidth overflow. So instead we look for any element whose right
// edge is genuinely past its OWN parent's right edge (skipping elements
// inside intentional horizontal-scroll regions like the story carousel).
const OVERFLOW_CHECK = () => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('.animate-marquee')) return;
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return;
    let p = el.parentElement;
    while (p) {
      const pcs = getComputedStyle(p);
      if (pcs.overflowX === 'auto' || pcs.overflowX === 'scroll') return;
      p = p.parentElement;
    }
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right <= vw + 3) return;
    const parent = el.parentElement;
    const pr = parent ? parent.getBoundingClientRect() : null;
    const stickOut = pr ? r.right - pr.right : 0;
    if (stickOut > 1) {
      offenders.push({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 120),
        text: (el.textContent || '').trim().slice(0, 50),
        stickOutPastParent: Math.round(stickOut),
      });
    }
  });
  return offenders;
};

const BROKEN_IMAGES_CHECK = () =>
  Array.from(document.querySelectorAll('img'))
    .filter((img) => img.complete && img.naturalWidth === 0)
    .map((img) => img.currentSrc || img.src);

async function scrollThroughPage(page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function main() {
  const { cmd, target, opts, width, height } = parseArgs(process.argv.slice(2));
  if (!cmd || !target) {
    console.error('Usage: node driver.mjs <nav|check|console> <path> [--out shot.png] [--viewport 390x844] [--full]');
    process.exit(1);
  }
  const url = BASE_URL + target;

  await withPage({ width, height }, async (page, consoleMsgs) => {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(400);

    if (cmd === 'nav') {
      // --full without a scroll pass under-reports: next/image lazy-loads
      // anything below the fold, so a fullPage screenshot taken right after
      // networkidle shows those sections as empty gray boxes even though
      // they're not actually broken. Scroll through first to trigger them.
      if (opts.full) await scrollThroughPage(page);
      await page.screenshot({ path: path.resolve(opts.out), fullPage: opts.full });
      console.log(`Screenshot saved: ${path.resolve(opts.out)}`);
      const errors = consoleMsgs.filter((m) => m.startsWith('[error]') || m.startsWith('[pageerror]'));
      if (errors.length) {
        console.log('Console errors:');
        errors.forEach((e) => console.log('  ' + e));
      } else {
        console.log('No console errors.');
      }
      return;
    }

    if (cmd === 'console') {
      consoleMsgs.forEach((m) => console.log(m));
      return;
    }

    if (cmd === 'check') {
      await scrollThroughPage(page);
      const overflow = await page.evaluate(OVERFLOW_CHECK);
      const broken = await page.evaluate(BROKEN_IMAGES_CHECK);
      console.log(`URL: ${url}  viewport: ${width}x${height}`);
      console.log(`Overflow offenders: ${overflow.length}`);
      if (overflow.length) console.log(JSON.stringify(overflow, null, 2));
      console.log(`Broken images: ${broken.length}`);
      if (broken.length) console.log(JSON.stringify(broken, null, 2));
      if (overflow.length === 0 && broken.length === 0) {
        console.log('OK — no overflow, no broken images.');
      } else {
        process.exitCode = 1;
      }
      return;
    }

    console.error(`Unknown command: ${cmd}`);
    process.exitCode = 1;
  });
}

main();
