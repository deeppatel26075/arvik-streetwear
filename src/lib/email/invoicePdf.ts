import 'server-only';
import QRCode from 'qrcode';
import { buildInvoiceHtml, getInvoiceOrderUrl, getInvoiceNumber } from '@/lib/invoice';
import type { Order } from '@/lib/orders';

// Turns an order into the same ARVIIK invoice customers download from their
// account, as a PDF, on the server, so it can be attached to the thank-you
// email. On Vercel (Linux) it uses @sparticuz/chromium, a Chromium build
// made for serverless; on a developer's Windows/Mac machine it falls back to
// Playwright's Chromium (a dev dependency) instead.

const SITE = 'https://www.arviik.in';

// Loaded at runtime by name so the dev-only fallback is never bundled into
// the deployed function.
const runtimeImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function invoiceFileName(order: Order) {
  return `ARVIIK-Invoice-${getInvoiceNumber(order)}.pdf`;
}

export async function renderInvoicePdf(order: Order): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(getInvoiceOrderUrl(order, SITE), {
    width: 160,
    margin: 0,
    color: { dark: '#111111', light: '#ffffff' },
  }).catch(() => null);

  // Photos go through the site's image optimizer at thumbnail size, so the
  // PDF stays small (full-size product photos made it ~5 MB). Relative
  // paths (the watermark) are resolved against the live site.
  const invoice = buildInvoiceHtml(order, { qrDataUrl }).replace(/<img src="([^"]+)"/g, (m, src: string) => {
    if (src.startsWith('data:')) return m;
    // Site images go by their path; other sites' by full URL. q=75 is the
    // only quality Next.js allows by default.
    const target = /^https?:\/\//.test(src) ? src : `/${src.replace(/^\//, '')}`;
    const width = src.includes('arviik-mark') ? 384 : 128;
    return `<img src="${SITE}/_next/image?url=${encodeURIComponent(target)}&w=${width}&q=75"`;
  });
  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <style>html,body{margin:0;background:#fff}body{display:flex;justify-content:center}</style>
    </head><body>${invoice}</body></html>`;

  const pdfOptions = {
    format: 'A4' as const,
    printBackground: true,
    // Slightly scaled so the whole bill fits on one A4 page.
    scale: 0.76,
    margin: { top: '6mm', bottom: '6mm', left: '0', right: '0' },
  };

  if (process.platform === 'linux') {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load', timeout: 20000 });
      // Make sure every image (product photos, watermark) has finished.
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images).map((img) =>
            img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })
          )
        )
      );
      return Buffer.from(await page.pdf(pdfOptions));
    } finally {
      await browser.close();
    }
  }

  // Local development (Windows / macOS).
  const { chromium } = await runtimeImport('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 20000 });
    return Buffer.from(await page.pdf(pdfOptions));
  } finally {
    await browser.close();
  }
}
