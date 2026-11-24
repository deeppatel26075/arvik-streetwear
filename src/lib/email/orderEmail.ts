// The "Thank you for your order" email sent right after an order is placed
// (COD, or online once Razorpay has verified the payment). Same look as the
// Club welcome email: inline styles + tables so every inbox renders it.

import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { orderDisplayId } from '@/lib/orders';

const SITE = 'https://www.arviik.in';

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  items: { name: string; size: string; quantity: number; unitPrice: number; image?: string }[];
  shippingFee: number;
  total: number;
  paymentMethod: 'cod' | 'razorpay';
  address: { line: string; city: string; state: string; pincode: string; phone: string };
}

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Product photos must be absolute URLs in an email.
const absolute = (src?: string) => (!src ? '' : /^https?:\/\//.test(src) ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`);

export function orderEmailSubject(d: OrderEmailData) {
  return `Thank you for your order ${orderDisplayId(d.orderId)} · ARVIIK`;
}

export function orderEmailHtml(d: OrderEmailData): string {
  const firstName = esc((d.customerName || '').trim().split(/\s+/)[0] || 'there');
  const orderNo = esc(orderDisplayId(d.orderId));
  const subtotal = d.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const isCod = d.paymentMethod === 'cod';

  const itemRows = d.items
    .map((i) => {
      const img = absolute(i.image);
      return `
      <tr>
        <td width="64" style="padding:0 0 14px 0;" valign="top">
          ${img ? `<img src="${esc(img)}" width="56" height="70" alt="" style="display:block;width:56px;height:70px;object-fit:cover;border-radius:8px;background:#292524;" />` : ''}
        </td>
        <td style="padding:0 0 14px 12px;font-family:Helvetica,Arial,sans-serif;" valign="top">
          <div style="font-size:14px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">${esc(i.name)}</div>
          <div style="font-size:12px;color:#a8a29e;margin-top:4px;">Size ${esc(i.size)} · Qty ${i.quantity}</div>
        </td>
        <td align="right" style="padding:0 0 14px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#ffffff;white-space:nowrap;" valign="top">
          ${rupees(i.unitPrice * i.quantity)}
        </td>
      </tr>`;
    })
    .join('');

  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:${strong ? 15 : 13}px;color:${strong ? '#ffffff' : '#a8a29e'};font-weight:${strong ? 800 : 400};">${label}</td>
      <td align="right" style="padding:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:${strong ? 15 : 13}px;color:#ffffff;font-weight:${strong ? 800 : 400};">${value}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>Thank you for your order</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;">
  <div style="display:none;max-height:0;overflow:hidden;">Your order ${orderNo} is confirmed. Here's everything you need to know.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141210;border:1px solid #292524;border-radius:16px;">
          <tr>
            <td align="center" style="padding:40px 32px 8px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-weight:800;font-size:30px;letter-spacing:10px;color:#ffffff;">ARVIIK</div>
              <div style="width:120px;height:2px;background:#a3e635;margin:14px auto 0 auto;"></div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#a8a29e;margin-top:12px;">WEAR YOUR IDENTITY</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 4px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;color:#a3e635;">ORDER CONFIRMED · ${orderNo}</div>
              <h1 style="margin:10px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:28px;line-height:32px;font-weight:800;color:#ffffff;text-transform:uppercase;">Thank you, ${firstName}</h1>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#d6d3d1;">
                Your order is in and we're getting it ready. ${
                  isCod
                    ? `You chose <strong style="color:#ffffff;">Cash on Delivery</strong>, so please keep ${rupees(d.total)} ready when it arrives.`
                    : `Your payment of <strong style="color:#ffffff;">${rupees(d.total)}</strong> was received.`
                }
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 6px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a29e;margin-bottom:14px;">YOUR ORDER</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #292524;margin-top:4px;padding-top:10px;">
                ${row('Subtotal', rupees(subtotal))}
                ${row('Shipping & fees', d.shippingFee > 0 ? rupees(d.shippingFee) : 'Free')}
                ${subtotal + d.shippingFee - d.total >= 1 ? row('Discount', `-${rupees(subtotal + d.shippingFee - d.total)}`) : ''}
                ${row(isCod ? 'To pay on delivery' : 'Total paid', rupees(d.total), true)}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px 6px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a29e;margin-bottom:8px;">DELIVERING TO</div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#e7e5e4;">
                ${esc(d.customerName)}<br />
                ${esc(d.address.line)}<br />
                ${esc(d.address.city)}, ${esc(d.address.state)} ${esc(d.address.pincode)}<br />
                ${esc(d.address.phone)}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px 6px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a29e;margin-bottom:8px;">WHAT HAPPENS NEXT</div>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#d6d3d1;">
                We usually dispatch within <strong style="color:#ffffff;">24–48 hours</strong>, and delivery takes
                <strong style="color:#ffffff;">3–5 business days</strong> across India. You can follow your order any time on Track Order.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:26px 32px 32px 32px;">
              <a href="${SITE}/track-order" style="display:inline-block;background:#a3e635;color:#0c0a09;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;text-decoration:none;padding:16px 32px;border-radius:999px;">TRACK MY ORDER &rarr;</a>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 32px 32px;border-top:1px solid #292524;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:20px;color:#a8a29e;">
                Need a different size? You can exchange within 7 days of delivery (unworn, tags on).
                <a href="${SITE}/refund-policy" style="color:#ffffff;">Exchange Policy</a>.
                Your bill is attached to this email as a PDF.
                Questions? Reply to this email, write to <a href="mailto:info@arviik.in" style="color:#ffffff;">info@arviik.in</a>
                or WhatsApp us at <a href="${whatsappLink(`Hi ARVIIK! About my order ${orderDisplayId(d.orderId)}`)}" style="color:#ffffff;">${WHATSAPP_DISPLAY}</a>.
              </p>
              <p style="margin:14px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#78716c;">
                Thank you for wearing your identity. · Team ARVIIK<br />
                ARVIIK · Ahmedabad, Gujarat, India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function orderEmailText(d: OrderEmailData): string {
  const isCod = d.paymentMethod === 'cod';
  return [
    `THANK YOU FOR YOUR ORDER ${orderDisplayId(d.orderId)}`,
    '',
    `Hi ${(d.customerName || '').trim().split(/\s+/)[0] || 'there'}, your order is in and we're getting it ready.`,
    isCod ? `Cash on Delivery: please keep ${rupees(d.total)} ready when it arrives.` : `Payment received: ${rupees(d.total)}.`,
    '',
    'YOUR ORDER',
    ...d.items.map((i) => `- ${i.name} (Size ${i.size}) x${i.quantity}: ${rupees(i.unitPrice * i.quantity)}`),
    `Shipping & fees: ${d.shippingFee > 0 ? rupees(d.shippingFee) : 'Free'}`,
    `${isCod ? 'To pay on delivery' : 'Total paid'}: ${rupees(d.total)}`,
    '',
    'DELIVERING TO',
    d.customerName,
    d.address.line,
    `${d.address.city}, ${d.address.state} ${d.address.pincode}`,
    d.address.phone,
    '',
    'We usually dispatch within 24-48 hours; delivery takes 3-5 business days across India.',
    `Track your order: ${SITE}/track-order`,
    '',
    `Need a different size? Exchange within 7 days of delivery (unworn, tags on): ${SITE}/refund-policy`,
    `Questions? Reply to this email, write to info@arviik.in or WhatsApp ${WHATSAPP_DISPLAY}.`,
    '',
    'Thank you for wearing your identity. Team ARVIIK',
  ].join('\n');
}
