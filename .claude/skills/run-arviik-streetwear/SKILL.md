---
name: run-arviik-streetwear
description: Build, run, and drive the ARVIIK Next.js storefront. Use when asked to start the dev server, take a screenshot of a page, check a page for layout/overflow bugs or broken images, or verify a UI change actually renders correctly.
---

This is a Next.js 16 (Turbopack) e-commerce storefront. Start the dev
server, then drive it via `.claude/skills/run-arviik-streetwear/driver.mjs`
(Playwright under the hood) — there's no `chromium-cli` in this
environment, so this driver is the harness.

All paths below are relative to the repo root (where `package.json` lives).

## Prerequisites

This machine did not have Node.js on PATH originally. If `node`/`npm`
aren't found:

```powershell
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

Then start a fresh shell (or refresh PATH in the current one) before
continuing — a just-installed winget package isn't on PATH in the
shell that installed it.

## Setup

```bash
npm install
```

`playwright` is already a devDependency (added for this driver) with
chromium pre-downloaded. If chromium is ever missing:

```bash
npx playwright install chromium
```

No `.env` is required to run the app — `src/lib/supabase.ts` has a live
Supabase project hardcoded as a fallback, so the site connects to a real
(remote) database even with zero local env vars. See Gotchas.

## Run (agent path)

Start the dev server in the background and wait for it to actually serve
(don't `sleep`, poll the port):

```bash
npm run dev &
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Then drive it with the script in this directory:

```bash
node .claude/skills/run-arviik-streetwear/driver.mjs <nav|check|console> <path> [options]
```

| command | what it does |
|---|---|
| `nav <path> --out <file.png> [--viewport WxH] [--full]` | Navigate, screenshot, print any console errors seen |
| `check <path> [--viewport WxH]` | Navigate, **scroll through the whole page** (triggers lazy images), then report real layout bugs — see Gotchas for why this exists |
| `console <path>` | Navigate, dump all browser console output |

Example — screenshot the product page at an iPhone 12 Pro viewport:

```bash
node .claude/skills/run-arviik-streetwear/driver.mjs nav /shop/eternal-vision-black-tee \
  --out /tmp/product.png --viewport 390x844
```

Example — check the About page for overflow/broken images:

```bash
node .claude/skills/run-arviik-streetwear/driver.mjs check /about --viewport 1280x900
```

**Windows/Git Bash gotcha:** Git Bash rewrites a leading `/` in any
argument into a Windows path (`/about` → `C:/Program Files/Git/about`),
which silently breaks the URL. Prefix the command with
`MSYS_NO_PATHCONV=1`:

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/run-arviik-streetwear/driver.mjs nav /about --out shot.png
```

Screenshots/output go wherever `--out` points — pass an absolute path.

To stop the dev server, kill whatever's listening on 3000 (`npm run dev &`'s
`$!` is only the npm wrapper — npm doesn't forward the kill to the real
server process):

```bash
# Windows: find + kill by port
netstat -ano | grep :3000
taskkill //PID <pid> //F
```

## Run (human path)

```bash
npm run dev   # → http://localhost:3000, Ctrl-C to stop
```

## Test

No test suite is configured in this project (no `test` script in
`package.json`).

---

## Gotchas

- **`document.scrollWidth` does NOT catch this project's real overflow
  bugs.** `globals.css` sets `overflow-x: hidden` on `html`/`body` as a
  safety net against horizontal scrollbars. That net also hides the
  symptom from the standard `scrollWidth > clientWidth` overflow check —
  clipped content doesn't register as "scrollable," so it silently
  passes. The `check` command instead walks every element and flags any
  whose right edge is past its own parent's right edge, while ignoring
  elements that are *inside* an intentional `overflow-x: auto` region
  (carousels). This is how a real header overflow bug (Cart icon clipped
  off-screen on phones ≤430px) and a real cross-page layout bug (one
  unwrappable flex row inflating the entire page's width via flexbox's
  default `min-width: auto` propagating up through `<main>`) were both
  found this session — a plain scrollWidth check missed both.
- **A live Supabase database is reachable with zero local config.**
  `src/lib/supabase.ts` falls back to a real, hardcoded project URL/key
  when `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` aren't set. Product pages
  will render real (sometimes broken — e.g. image URLs pointing at files
  that don't exist locally) remote data instead of the local
  `MOCK_PRODUCTS` fallback in `src/app/page.tsx`, even with no `.env`
  file anywhere. If a page looks wrong, check whether you're editing the
  mock data (which may never be reached) versus what's actually live.
- **Lazy-loaded images make a `fullPage: true` screenshot lie.**
  `next/image` without `priority` only loads once near-viewport. A
  screenshot taken right after `networkidle` shows below-the-fold
  sections as empty gray boxes that look broken but aren't — the image
  just never got asked to load. `driver.mjs`'s `nav --full` scrolls the
  whole page first for this reason; `check` does too.
- **A downscaled full-page screenshot can *look* broken when it isn't.**
  Product photography here often has a light/neutral backdrop; compressed
  into a small thumbnail (e.g. a 3000px-tall page shown at 30% scale),
  real photo content can visually flatten into what looks like a solid
  gray placeholder box. Before concluding an image is broken, crop just
  that element at full resolution (`getBoundingClientRect` + `clip` in
  `page.screenshot`) rather than trusting the full-page thumbnail.
- **Confirm a fix with `naturalWidth`, not just visual inspection.**
  `img.complete && img.naturalWidth === 0` is the reliable broken-image
  signal; `BROKEN_IMAGES_CHECK` in the driver uses exactly this.

## Troubleshooting

- **`npm` / `node` not recognized**: Node wasn't on PATH in this shell.
  See Prerequisites — install via winget, then open a new shell.
- **`page.goto: Protocol error ... Cannot navigate to invalid URL` with a
  path like `http://localhost:3000C:/Program Files/Git/...`**: Git Bash's
  MSYS path conversion mangled a leading `/` argument. Prefix the command
  with `MSYS_NO_PATHCONV=1` (see Run section above).
- **`Cannot find module 'playwright'` when running `driver.mjs`**: you
  ran `node` from outside the repo (or a copy of the script elsewhere).
  Node resolves `node_modules` by walking up from the script's own
  location, so run it via the path shown above from the repo root, not
  after `cd`-ing into the skill directory.
