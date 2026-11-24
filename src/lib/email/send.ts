import 'server-only';

// One place that sends email through Resend, used by the Club welcome email
// and the order thank-you email. Needs RESEND_API_KEY; the sender defaults
// to "ARVIIK <hello@arviik.in>" (override with CLUB_FROM_EMAIL) and replies
// go to info@arviik.in.

export type SendResult = { ok: true } | { ok: false; reason: 'not_configured' | 'failed'; detail?: string };

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: 'not_configured' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CLUB_FROM_EMAIL || 'ARVIIK <hello@arviik.in>',
        to: [opts.to],
        reply_to: 'info@arviik.in',
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        ...(opts.attachments?.length
          ? { attachments: opts.attachments.map((a) => ({ filename: a.filename, content: a.content.toString('base64') })) }
          : {}),
      }),
    });
    if (!res.ok) return { ok: false, reason: 'failed', detail: `${res.status} ${await res.text().catch(() => '')}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'failed', detail: String(err) };
  }
}
