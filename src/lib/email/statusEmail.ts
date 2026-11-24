// Order progress emails, sent when the admin moves an order to the next
// stage (Accept, Packing, Ship, Deliver, Cancel). Each one says where the
// order is, shows a progress tracker, and explains what happens next.
// Same look as the thank-you email: inline styles + tables.

import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { orderDisplayId } from '@/lib/orders';

const SITE = 'https://www.arviik.in';

export type EmailStage = 'accepted' | 'packing' | 'shipped' | 'delivered' | 'cancelled';

export interface StatusEmailData {
  orderId: string;
  customerName: string;
  stage: EmailStage;
  items: { name: string; size: string; quantity: number; image?: string }[];
  total: number;
  paymentMethod: 'cod' | 'online';
}

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const absolute = (src?: string) => (!src ? '' : /^https?:\/\//.test(src) ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`);

const STEPS: { key: EmailStage | 'placed'; label: string }[] = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'packing', label: 'Packing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

interface StageCopy {
  eyebrow: string;
  subject: (orderNo: string) => string;
  headline: (name: string, orderNo: string) => string;
  body: (d: StatusEmailData) => string;
  next: (d: StatusEmailData) => string;
  cta: { label: string; href: string };
}

const COPY: Record<EmailStage, StageCopy> = {
  accepted: {
    eyebrow: 'Order accepted',
    subject: (o) => `Your order ${o} has been accepted · ARVIIK`,
    headline: (n, o) => `Hey ${n}, your order ${o} has been accepted`,
    body: () => "Good news: we've checked your order and it's confirmed. Our team is getting your pieces ready.",
    next: () =>
      "Next, we'll pack your order with care, usually within 24–48 hours. You'll get an email when it's packed and another when it ships.",
    cta: { label: 'TRACK MY ORDER', href: `${SITE}/track-order` },
  },
  packing: {
    eyebrow: 'Being packed',
    subject: (o) => `Your order ${o} is being packed · ARVIIK`,
    headline: (n, o) => `Hey ${n}, your order ${o} is being packed`,
    body: () => 'Your tees are being quality-checked, folded and packed. Almost ready to leave our studio in Ahmedabad.',
    next: () => "Next, we'll hand it to our courier partner. You'll get an email as soon as it ships.",
    cta: { label: 'TRACK MY ORDER', href: `${SITE}/track-order` },
  },
  shipped: {
    eyebrow: 'On its way',
    subject: (o) => `Your order ${o} has shipped · ARVIIK`,
    headline: (n, o) => `Hey ${n}, your order ${o} is on its way`,
    body: (d) =>
      `Your order has left our studio and is with our courier partner.${
        d.paymentMethod === 'cod' ? ` Please keep <strong style="color:#ffffff;">${rupees(d.total)}</strong> ready to pay on delivery.` : ''
      }`,
    next: () =>
      'Delivery usually takes 3–5 business days across India (remote pincodes can take a little longer). Please keep your phone handy so the delivery partner can reach you.',
    cta: { label: 'TRACK MY ORDER', href: `${SITE}/track-order` },
  },
  delivered: {
    eyebrow: 'Delivered',
    subject: (o) => `Your order ${o} has been delivered · ARVIIK`,
    headline: (n, o) => `Hey ${n}, your order ${o} has been delivered`,
    body: () => 'Your ARVIIK order has arrived. We hope you love it. Wear your identity.',
    next: () =>
      'Not the right size? You can exchange within <strong style="color:#ffffff;">7 days of delivery</strong> (unworn, unwashed, tags on). If anything arrived damaged or wrong, tell us within <strong style="color:#ffffff;">48 hours</strong> with a photo and we\'ll replace it.',
    cta: { label: 'SHOP THE LATEST DROP', href: `${SITE}/shop` },
  },
  cancelled: {
    eyebrow: 'Order cancelled',
    subject: (o) => `Your order ${o} has been cancelled · ARVIIK`,
    headline: (n, o) => `Hey ${n}, your order ${o} has been cancelled`,
    body: (d) =>
      `Your order has been cancelled and won't be shipped.${
        d.paymentMethod === 'online'
          ? ' If you paid online, any refund due under our cancellation policy goes back to your original payment method.'
          : ''
      }`,
    next: () =>
      "If you didn't ask for this or think it's a mistake, just reply to this email or WhatsApp us and we'll sort it out right away.",
    cta: { label: 'BROWSE THE SHOP', href: `${SITE}/shop` },
  },
};

export function statusEmailSubject(d: StatusEmailData) {
  return COPY[d.stage].subject(orderDisplayId(d.orderId));
}

function tracker(stage: EmailStage): string {
  if (stage === 'cancelled') return '';
  const current = STEPS.findIndex((s) => s.key === stage);
  const cells = STEPS.map((s, i) => {
    const done = i <= current;
    return `
      <td align="center" valign="top" width="20%" style="padding:0 2px;">
        <div style="height:4px;border-radius:4px;background:${done ? '#a3e635' : '#292524'};"></div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:${i === current ? 800 : 600};letter-spacing:1px;text-transform:uppercase;color:${
          i === current ? '#a3e635' : done ? '#e7e5e4' : '#57534e'
        };margin-top:8px;">${s.label}</div>
      </td>`;
  }).join('');
  return `
    <tr>
      <td style="padding:26px 32px 4px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
      </td>
    </tr>`;
}

export function statusEmailHtml(d: StatusEmailData): string {
  const c = COPY[d.stage];
  const firstName = esc((d.customerName || '').trim().split(/\s+/)[0] || 'there');
  const orderNo = esc(orderDisplayId(d.orderId));
  const accent = d.stage === 'cancelled' ? '#f87171' : '#a3e635';

  const itemRows = d.items
    .map((i) => {
      const img = absolute(i.image);
      return `
      <tr>
        <td width="52" style="padding:0 0 12px 0;" valign="top">
          ${img ? `<img src="${esc(img)}" width="44" height="55" alt="" style="display:block;width:44px;height:55px;object-fit:cover;border-radius:6px;background:#292524;" />` : ''}
        </td>
        <td style="padding:0 0 12px 12px;font-family:Helvetica,Arial,sans-serif;" valign="middle">
          <div style="font-size:13px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">${esc(i.name)}</div>
          <div style="font-size:12px;color:#a8a29e;margin-top:3px;">Size ${esc(i.size)} · Qty ${i.quantity}</div>
        </td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>${esc(c.subject(orderDisplayId(d.orderId)))}</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(c.eyebrow)}: order ${orderNo}.</div>
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
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;color:${accent};text-transform:uppercase;">${esc(c.eyebrow)} · ${orderNo}</div>
              <h1 style="margin:10px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:24px;line-height:30px;font-weight:800;color:#ffffff;">${c.headline(firstName, `<span style="white-space:nowrap;">${orderNo}</span>`)}</h1>
              <p style="margin:14px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#d6d3d1;">${c.body(d)}</p>
            </td>
          </tr>
          ${tracker(d.stage)}
          <tr>
            <td style="padding:26px 32px 4px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a29e;margin-bottom:8px;">${d.stage === 'cancelled' ? 'WHAT NOW' : "WHAT'S NEXT"}</div>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#d6d3d1;">${c.next(d)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 4px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a29e;margin-bottom:12px;">YOUR ORDER</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 32px 32px 32px;">
              <a href="${c.cta.href}" style="display:inline-block;background:#a3e635;color:#0c0a09;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;text-decoration:none;padding:16px 32px;border-radius:999px;">${c.cta.label} &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px;border-top:1px solid #292524;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:20px;color:#a8a29e;">
                Questions? Reply to this email, write to <a href="mailto:info@arviik.in" style="color:#ffffff;">info@arviik.in</a>
                or WhatsApp us at <a href="${whatsappLink(`Hi ARVIIK! About my order ${orderDisplayId(d.orderId)}`)}" style="color:#ffffff;">${WHATSAPP_DISPLAY}</a>.
              </p>
              <p style="margin:14px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#78716c;">
                Thank you for wearing your identity. · Team ARVIIK<br />ARVIIK · Ahmedabad, Gujarat, India
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

export function statusEmailText(d: StatusEmailData): string {
  const c = COPY[d.stage];
  const firstName = (d.customerName || '').trim().split(/\s+/)[0] || 'there';
  const strip = (s: string) => s.replace(/<[^>]+>/g, '');
  return [
    c.headline(firstName, orderDisplayId(d.orderId)).toUpperCase(),
    '',
    strip(c.body(d)),
    '',
    d.stage === 'cancelled' ? 'WHAT NOW' : "WHAT'S NEXT",
    strip(c.next(d)),
    '',
    'YOUR ORDER',
    ...d.items.map((i) => `- ${i.name} (Size ${i.size}) x${i.quantity}`),
    '',
    `${c.cta.label.charAt(0) + c.cta.label.slice(1).toLowerCase()}: ${c.cta.href}`,
    `Questions? Reply to this email, write to info@arviik.in or WhatsApp ${WHATSAPP_DISPLAY}.`,
    '',
    'Thank you for wearing your identity. Team ARVIIK',
  ].join('\n');
}
