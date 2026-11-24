import { welcomeEmailHtml, welcomeEmailText, WELCOME_SUBJECT } from '@/lib/email/welcomeEmail';

// Footer "Join the ARVIIK Club" sign-up: sends the welcome email through
// Resend and, when RESEND_AUDIENCE_ID is set, also saves the address to that
// Resend audience so newsletters can be sent from the Resend dashboard.
//
// Environment (Vercel → Settings → Environment Variables):
//   RESEND_API_KEY      required: the Resend API key
//   CLUB_FROM_EMAIL     optional: sender, default "ARVIIK <hello@arviik.in>"
//                       (its domain must be verified in Resend)
//   RESEND_AUDIENCE_ID  optional: audience to store subscribers in

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Light abuse protection (per server instance): a few sign-ups per visitor
// per hour, and the same address is only welcomed once a day.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 5;
const hits = new Map<string, number[]>();
const recentlyWelcomed = new Map<string, number>();

function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_IP) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body?.email || '').trim().toLowerCase();
  } catch {
    // handled below
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'invalid_email' }, { status: 400 });
  }

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
  if (limited(ip)) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Club sign-up: RESEND_API_KEY is not set, so no welcome email was sent.');
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  // Already welcomed recently: treat as success, don't email twice.
  const last = recentlyWelcomed.get(email);
  if (last && Date.now() - last < 24 * WINDOW_MS) {
    return Response.json({ ok: true, alreadyWelcomed: true });
  }

  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const from = process.env.CLUB_FROM_EMAIL || 'ARVIIK <hello@arviik.in>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from,
      to: [email],
      reply_to: 'info@arviik.in',
      subject: WELCOME_SUBJECT,
      html: welcomeEmailHtml(),
      text: welcomeEmailText(),
    }),
  }).catch((err) => {
    console.error('Club sign-up: could not reach Resend:', err);
    return null;
  });

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => '') : 'network error';
    console.error('Club sign-up: Resend rejected the welcome email:', res?.status, detail);
    return Response.json({ error: 'send_failed' }, { status: 502 });
  }
  recentlyWelcomed.set(email, Date.now());

  // Save to the audience for future newsletters (best effort).
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, unsubscribed: false }),
    }).catch((err) => console.error('Club sign-up: could not save contact:', err));
  }

  return Response.json({ ok: true });
}
