import type { Order } from '@/lib/orders';
import { orderDisplayId } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import { FLAT_COD_FEE_RUPEES } from '@/lib/shippingConfig';

// Fill these in once the business is GST-registered. Leaving `gstin` empty
// keeps the invoice honest with how the storefront actually prices things
// today (every price shown on-site is "inclusive of all taxes", with no
// real CGST/SGST split anywhere in the system) — it swaps the tax-column
// table for a plain "Inclusive of all taxes" line instead of fabricating
// a breakup. Fill in `gstin` (and adjust the rates below if needed) once
// there's a real GST registration to invoice against.
const SELLER = {
  businessName: 'ARVIIK APPARELS PRIVATE LIMITED',
  addressLine1: 'Ahmedabad, Gujarat',
  gstin: '', // e.g. '24AAAAA0000A1Z5'
  supportEmail: 'support@arviik.com',
  domain: 'arviik.in',
};

const CGST_RATE = 2.5; // %
const SGST_RATE = 2.5; // %

// The invoice's fixed rendered width — sized to fit A4 (210mm) minus
// html2pdf's default 10mm margins on each side. Exported so the on-page
// "View Invoice" modal can scale this exact document down to fit small
// screens without touching the PDF-generation path or duplicating the
// number.
export const INVOICE_WIDTH_PX = 700;

// place_order() now stores the flat shipping/COD fee actually charged on
// orders.shipping_fee (see migration_nimbuspost_shipping.sql) — orders
// placed before that migration ran will have `shipping_fee` as
// null/undefined from the DB, which this treats as the 0 it actually was.

// There's no invoice-numbering column/sequence on the `orders` table yet,
// so this derives a stable, order-specific number from the order's own
// UUID — a pure function of order.id, never Math.random() — so reloading
// the same order always reproduces the exact same invoice number instead
// of minting a new one on every render.
export function getInvoiceNumber(order: Order) {
  return `ARV-INV-${order.id.slice(0, 8).toUpperCase()}`;
}

type PaymentStatusVariant = 'paid' | 'partial' | 'pending';

interface PaymentInfo {
  paidAmount: number;
  balanceDue: number;
  variant: PaymentStatusVariant;
  statusLabel: string;
  statusSubLabel: string;
  methodLabel: string;
}

// Every figure here comes straight off order.total_amount and the real
// payments rows (status + amount + provider) — nothing here is assumed.
// A COD order's payment row is written by place_order() with status
// 'pending' and amount = the order total, so "paid" only counts rows
// that actually succeeded; partial payment falls naturally out of the
// same math the moment more than one payment row exists for an order,
// without needing a dedicated "partial" status value anywhere.
function getPaymentInfo(order: Order): PaymentInfo {
  const payments = order.payments || [];
  const paidAmount = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const total = order.total_amount;
  const balanceDue = Math.max(0, Math.round((total - paidAmount) * 100) / 100);

  const primary = payments[0];
  const isCod = !primary || primary.provider === 'cod';
  const methodLabel = isCod ? 'Cash on Delivery' : 'Prepaid (Online)';

  let variant: PaymentStatusVariant;
  let statusLabel: string;
  let statusSubLabel: string;

  if (paidAmount <= 0) {
    variant = 'pending';
    statusLabel = 'PENDING';
    statusSubLabel = isCod ? 'CASH ON DELIVERY' : 'AWAITING PAYMENT';
  } else if (paidAmount < total) {
    variant = 'partial';
    statusLabel = 'PARTIALLY PAID';
    statusSubLabel = `${formatPrice(paidAmount)} OF ${formatPrice(total)} PAID`;
  } else {
    variant = 'paid';
    statusLabel = 'PAID';
    statusSubLabel = '✓ PAYMENT RECEIVED';
  }

  return { paidAmount, balanceDue, variant, statusLabel, statusSubLabel, methodLabel };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Points at this order's real, authenticated order-detail page — the only
// "order tracking" surface that actually exists in this app today
// (/track-order is a demo lookup with no real backend query behind it).
// `origin` is passed in by the caller since this module has no DOM access
// of its own to read window.location from.
export function getInvoiceOrderUrl(order: Order, origin: string) {
  return `${origin}/account/orders/${order.id}`;
}

// QR generation needs the `qrcode` package, which (like html2pdf.js) only
// makes sense in the browser — callers await this before building the
// invoice HTML so the PDF and on-page view can both embed a real, working
// QR rather than a static placeholder image.
export async function getInvoiceQrDataUrl(order: Order, origin: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(getInvoiceOrderUrl(order, origin), {
      width: 160,
      margin: 0,
      color: { dark: '#111111', light: '#ffffff' },
    });
  } catch (err) {
    console.error('Failed to generate invoice QR code:', err);
    return null;
  }
}

interface BuildInvoiceOptions {
  qrDataUrl?: string | null;
}

// html2pdf.js clones this fragment into a detached node for its
// pagebreak/measurement pass, and a <style> tag shipped inside that
// fragment isn't reliably re-applied before it measures height — that
// silently produced a zero-height canvas (a blank PDF) even though the
// exact same markup rendered fine under a direct html2canvas call.
// Every rule below is inlined per-element instead, so it survives
// cloning regardless of stylesheet timing.
export function buildInvoiceHtml(order: Order, options: BuildInvoiceOptions = {}): string {
  const invoiceNumber = getInvoiceNumber(order);
  const invoiceDate = new Date(order.created_at)
    .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
  const hasGst = SELLER.gstin.trim().length > 0;
  const taxRate = (CGST_RATE + SGST_RATE) / 100;

  const itemsSubtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxableValue = hasGst ? itemsSubtotal / (1 + taxRate) : itemsSubtotal;
  const totalCgst = hasGst ? taxableValue * (CGST_RATE / 100) : 0;
  const totalSgst = hasGst ? taxableValue * (SGST_RATE / 100) : 0;
  const payment = getPaymentInfo(order);

  // orders.shipping_fee bundles the flat COD fee in for COD orders (no
  // separate column for it) — split it back out here purely for display,
  // so the invoice shows "Shipping" and "COD Fee" as the two distinct
  // charges they actually are rather than one unexplained lump sum.
  const totalShippingFee = order.shipping_fee || 0;
  const codFee = payment.methodLabel === 'Cash on Delivery' ? Math.min(FLAT_COD_FEE_RUPEES, totalShippingFee) : 0;
  const shippingFee = totalShippingFee - codFee;
  const discountAmt = Math.max(0, Math.round((itemsSubtotal + totalShippingFee - order.total_amount) * 100) / 100);

  const s = {
    // A4 is 210mm wide; with html2pdf's default 10mm margin on each side,
    // the printable area is ~718px at 96dpi — 700px (including its own
    // padding below) keeps the right-hand columns from clipping off the
    // page edge, which a wider box (780px) did.
    root: `position:relative;overflow:hidden;width:${INVOICE_WIDTH_PX}px;padding:30px;background:#ffffff;color:#111111;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;`,
    watermark: 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:340px;height:340px;object-fit:contain;opacity:0.05;z-index:0;pointer-events:none;',
    content: 'position:relative;z-index:1;',
    header: 'display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111111;padding-bottom:16px;margin-bottom:16px;',
    brandName: "font-family:'Courier New',monospace;font-weight:700;font-size:30px;letter-spacing:5px;margin:0;",
    brandTagline: 'font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#666666;margin:5px 0 0;',
    taxLabel: 'display:inline-block;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;border-bottom:2px solid #111111;padding-bottom:3px;margin-bottom:10px;',
    meta: 'text-align:right;font-size:11px;',
    metaRow: 'margin-bottom:3px;',
    metaLabel: 'color:#666666;text-transform:uppercase;letter-spacing:1px;font-size:9px;margin-right:6px;',
    statusBar: 'display:flex;justify-content:space-between;align-items:center;border:1px solid #111111;padding:10px 18px;margin-bottom:20px;',
    statusMain: 'font-size:13px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;',
    statusSub: 'font-size:9px;color:#666666;letter-spacing:1px;text-transform:uppercase;text-align:right;',
    parties: 'display:flex;justify-content:space-between;gap:30px;margin-bottom:28px;',
    party: 'flex:1;',
    partyLabel: 'font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#666666;margin-bottom:6px;border-bottom:1px solid #dddddd;padding-bottom:4px;',
    partyName: 'font-weight:700;font-size:13px;margin-bottom:3px;',
    partyLine: 'font-size:11px;color:#333333;',
    table: 'width:100%;border-collapse:collapse;margin-bottom:4px;',
    th: 'text-align:left;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#666666;border-top:1px solid #111111;border-bottom:1px solid #111111;padding:8px 6px;',
    td: 'font-size:11px;padding:9px 6px;border-bottom:1px solid #eeeeee;vertical-align:middle;',
    productCell: 'display:flex;align-items:center;gap:10px;',
    thumb: 'width:42px;height:50px;object-fit:cover;border:1px solid #eeeeee;flex-shrink:0;',
    productName: 'font-weight:700;',
    productSub: 'font-size:9px;color:#999999;letter-spacing:0.5px;text-transform:uppercase;margin-top:1px;',
    taxNote: 'font-size:10px;color:#666666;text-align:right;margin-bottom:20px;',
    totalsWrap: 'display:flex;justify-content:flex-end;margin-bottom:8px;',
    totalsTable: 'border-collapse:collapse;min-width:300px;',
    totalsTd: 'padding:5px 0;font-size:11px;',
    totalsLabel: 'color:#666666;padding-right:24px;',
    totalsValue: 'text-align:right;',
    grandTd: 'border-top:1px solid #111111;padding-top:9px;font-weight:700;font-size:14px;letter-spacing:0.5px;',
    grandTdBottom: 'border-bottom:2px solid #111111;padding-bottom:9px;',
    brandMoment: 'text-align:center;padding:18px 0 14px;border-top:1px solid #eeeeee;margin-top:6px;',
    brandMomentMain: 'font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin:0 0 5px;',
    brandMomentSub: 'font-size:9px;color:#999999;letter-spacing:1.5px;text-transform:uppercase;margin:0;',
    footer: 'display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #dddddd;padding-top:16px;',
    qrCaption: 'font-size:7.5px;color:#999999;letter-spacing:0.5px;text-transform:uppercase;margin-top:5px;text-align:center;width:76px;',
    footerBrand: 'text-align:right;font-size:9px;color:#666666;',
    footerBrandName: 'font-weight:700;letter-spacing:2px;color:#111111;margin:0 0 2px;',
    legal: 'font-size:8.5px;color:#999999;text-align:center;margin-top:18px;line-height:1.6;',
  };
  const center = 'text-align:center;';
  const right = 'text-align:right;';
  const strong = 'font-weight:700;';

  const itemRows = order.order_items
    .map((item) => {
      const name = escapeHtml(item.products?.name || 'Product');
      const size = escapeHtml(item.size || '-');
      const lineTotal = item.price * item.quantity;
      const imageUrl = item.products?.product_images?.[0]?.image_url;

      const productCell = `
        <div style="${s.productCell}">
          ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" style="${s.thumb}" onerror="this.style.display='none'" />` : ''}
          <div>
            <div style="${s.productName}">${name}</div>
            <div style="${s.productSub}">Arviik Streetwear</div>
          </div>
        </div>`;

      if (hasGst) {
        const itemTaxable = lineTotal / (1 + taxRate);
        const cgst = itemTaxable * (CGST_RATE / 100);
        const sgst = itemTaxable * (SGST_RATE / 100);
        return `
          <tr>
            <td style="${s.td}">${productCell}</td>
            <td style="${s.td}${center}">${size}</td>
            <td style="${s.td}${center}">${item.quantity}</td>
            <td style="${s.td}${right}">${formatPrice(item.price)}</td>
            <td style="${s.td}${right}">${formatPrice(itemTaxable)}</td>
            <td style="${s.td}${right}">${formatPrice(cgst)}</td>
            <td style="${s.td}${right}">${formatPrice(sgst)}</td>
            <td style="${s.td}${right}${strong}">${formatPrice(lineTotal)}</td>
          </tr>`;
      }

      return `
        <tr>
          <td style="${s.td}">${productCell}</td>
          <td style="${s.td}${center}">${size}</td>
          <td style="${s.td}${center}">${item.quantity}</td>
          <td style="${s.td}${right}">${formatPrice(item.price)}</td>
          <td style="${s.td}${right}${strong}">${formatPrice(lineTotal)}</td>
        </tr>`;
    })
    .join('');

  const tableHeadCells = hasGst
    ? `<th style="${s.th}">Product</th><th style="${s.th}${center}">Size</th><th style="${s.th}${center}">Qty</th><th style="${s.th}${right}">Unit Price</th><th style="${s.th}${right}">Taxable Value</th><th style="${s.th}${right}">CGST</th><th style="${s.th}${right}">SGST</th><th style="${s.th}${right}">Total</th>`
    : `<th style="${s.th}">Product</th><th style="${s.th}${center}">Size</th><th style="${s.th}${center}">Qty</th><th style="${s.th}${right}">Unit Price</th><th style="${s.th}${right}">Total</th>`;

  const pricingRows = hasGst
    ? `
        <tr>
          <td style="${s.totalsTd}${s.totalsLabel}">Taxable Value</td>
          <td style="${s.totalsTd}${s.totalsValue}">${formatPrice(taxableValue)}</td>
        </tr>
        <tr>
          <td style="${s.totalsTd}${s.totalsLabel}">CGST @ ${CGST_RATE}%</td>
          <td style="${s.totalsTd}${s.totalsValue}">${formatPrice(totalCgst)}</td>
        </tr>
        <tr>
          <td style="${s.totalsTd}${s.totalsLabel}">SGST @ ${SGST_RATE}%</td>
          <td style="${s.totalsTd}${s.totalsValue}">${formatPrice(totalSgst)}</td>
        </tr>`
    : `
        <tr>
          <td style="${s.totalsTd}${s.totalsLabel}">Subtotal</td>
          <td style="${s.totalsTd}${s.totalsValue}">${formatPrice(itemsSubtotal)}</td>
        </tr>`;

  const qrBlock = options.qrDataUrl
    ? `
        <div>
          <img src="${options.qrDataUrl}" width="76" height="76" style="display:block;" />
          <p style="${s.qrCaption}">Scan to view your order</p>
        </div>`
    : '<div></div>';

  return `
    <div style="${s.root}">
      <img src="/arviik-mark.png" style="${s.watermark}" />
      <div style="${s.content}">
      <div style="${s.header}">
        <div>
          <p style="${s.brandName}">ARVIIK</p>
          <p style="${s.brandTagline}">Wear Your Identity.</p>
        </div>
        <div style="${s.meta}">
          <span style="${s.taxLabel}">Tax Invoice</span>
          <div style="${s.metaRow}"><span style="${s.metaLabel}">Invoice No</span>${escapeHtml(invoiceNumber)}</div>
          <div style="${s.metaRow}"><span style="${s.metaLabel}">Order ID</span>${escapeHtml(orderDisplayId(order.id))}</div>
          <div style="${s.metaRow}"><span style="${s.metaLabel}">Invoice Date</span>${escapeHtml(invoiceDate)}</div>
        </div>
      </div>

      <div style="${s.statusBar}">
        <span style="${s.statusMain}">${escapeHtml(payment.statusLabel)}</span>
        <span style="${s.statusSub}">${escapeHtml(payment.statusSubLabel)}</span>
      </div>

      <div style="${s.parties}">
        <div style="${s.party}">
          <div style="${s.partyLabel}">Sold By</div>
          <div style="${s.partyName}">${escapeHtml(SELLER.businessName)}</div>
          <div style="${s.partyLine}">${escapeHtml(SELLER.addressLine1)}</div>
          ${hasGst ? `<div style="${s.partyLine}">GSTIN: ${escapeHtml(SELLER.gstin)}</div>` : ''}
        </div>
        <div style="${s.party}">
          <div style="${s.partyLabel}">Billed To</div>
          <div style="${s.partyName}">${escapeHtml(order.shipping_name)}</div>
          <div style="${s.partyLine}">${escapeHtml(order.shipping_address)}</div>
          <div style="${s.partyLine}">${escapeHtml(order.shipping_city)}, ${escapeHtml(order.shipping_state)} - ${escapeHtml(order.shipping_pincode)}</div>
          <div style="${s.partyLine}">Phone: ${escapeHtml(order.shipping_phone)}</div>
        </div>
      </div>

      <table style="${s.table}">
        <thead><tr>${tableHeadCells}</tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${!hasGst ? `<p style="${s.taxNote}">Inclusive of all taxes</p>` : ''}

      <div style="${s.totalsWrap}">
        <table style="${s.totalsTable}">
          ${pricingRows}
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}">Shipping</td>
            <td style="${s.totalsTd}${s.totalsValue}">${formatPrice(shippingFee)}</td>
          </tr>
          ${codFee > 0 ? `<tr><td style="${s.totalsTd}${s.totalsLabel}">COD Fee</td><td style="${s.totalsTd}${s.totalsValue}">${formatPrice(codFee)}</td></tr>` : ''}
          ${discountAmt > 0 ? `<tr><td style="${s.totalsTd}${s.totalsLabel}">Discount</td><td style="${s.totalsTd}${s.totalsValue}">-${formatPrice(discountAmt)}</td></tr>` : ''}
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}${s.grandTd}">Grand Total</td>
            <td style="${s.totalsTd}${s.totalsValue}${s.grandTd}">${formatPrice(order.total_amount)}</td>
          </tr>
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}${s.grandTdBottom}"></td>
            <td style="${s.totalsTd}${s.totalsValue}${s.grandTdBottom}"></td>
          </tr>
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}">Amount Paid</td>
            <td style="${s.totalsTd}${s.totalsValue}">${formatPrice(payment.paidAmount)}</td>
          </tr>
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}">Balance Due</td>
            <td style="${s.totalsTd}${s.totalsValue}${payment.balanceDue > 0 ? strong : ''}">${formatPrice(payment.balanceDue)}</td>
          </tr>
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}">Payment Method</td>
            <td style="${s.totalsTd}${s.totalsValue}">${escapeHtml(payment.methodLabel)}</td>
          </tr>
          <tr>
            <td style="${s.totalsTd}${s.totalsLabel}">Payment Status</td>
            <td style="${s.totalsTd}${s.totalsValue}${strong}">${escapeHtml(payment.statusLabel)}</td>
          </tr>
        </table>
      </div>

      <div style="${s.brandMoment}">
        <p style="${s.brandMomentMain}">Thank You For Choosing ARVIIK.</p>
        <p style="${s.brandMomentSub}">Not Just Clothes. It's Your Identity.</p>
      </div>

      <div style="${s.footer}">
        ${qrBlock}
        <div style="${s.footerBrand}">
          <p style="${s.footerBrandName}">ARVIIK</p>
          <p style="margin:0 0 2px;">Wear Your Identity.</p>
          <p style="margin:0 0 2px;">${escapeHtml(SELLER.domain)}</p>
          <p style="margin:0;">© ${new Date().getFullYear()} ${escapeHtml(SELLER.businessName)}</p>
        </div>
      </div>

      <p style="${s.legal}">
        This is a computer-generated invoice and does not require a signature.<br />
        Returns and exchanges are accepted within 14 days of delivery — see our Returns &amp; Exchanges policy for details.<br />
        For any questions about this order, write to us at ${escapeHtml(SELLER.supportEmail)}
      </p>
      </div>
    </div>`;
}

// html2pdf.js touches `window`/`self` at module-load time, so it can only
// ever be imported client-side — importing it at the top of a file that a
// Next.js "use client" page still gets server-rendered once would throw
// during that server pass. Loading it here, inside a function that only
// ever runs from a browser click handler, keeps it out of SSR entirely.
export async function downloadInvoice(order: Order): Promise<void> {
  if (typeof window === 'undefined') return;

  const html2pdf = (await import('html2pdf.js')).default;
  const qrDataUrl = await getInvoiceQrDataUrl(order, window.location.origin);

  // html2pdf.js clones whatever node is passed to `.from()` and re-parents
  // the clone inside its own wrapper for measurement/capture. If that node
  // itself carries `position: fixed`, the clone keeps it — and a
  // fixed-positioned child sits outside its new parent's normal flow, so
  // the parent's height:auto box collapses to 0 (a blank PDF), even though
  // the same markup renders fine elsewhere. So the positioning trick that
  // hides this off-screen from the user goes on an outer wrapper, while
  // the node actually passed to `.from()` is a plain, normally-positioned
  // child of it.
  const hiddenWrapper = document.createElement('div');
  hiddenWrapper.style.position = 'fixed';
  hiddenWrapper.style.top = '0';
  hiddenWrapper.style.left = '0';
  hiddenWrapper.style.zIndex = '-9999';
  hiddenWrapper.style.pointerEvents = 'none';

  const content = document.createElement('div');
  content.innerHTML = buildInvoiceHtml(order, { qrDataUrl });
  hiddenWrapper.appendChild(content);
  document.body.appendChild(hiddenWrapper);

  try {
    await html2pdf()
      .set({
        margin: 10,
        filename: `Arviik_Invoice_${getInvoiceNumber(order)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(content)
      .save();
  } finally {
    document.body.removeChild(hiddenWrapper);
  }
}
