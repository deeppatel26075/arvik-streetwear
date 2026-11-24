// The "Welcome to the ARVIIK Club" email sent when someone subscribes in the
// footer. Inline styles + tables only, so it renders the same in Gmail,
// Outlook and Apple Mail.

import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';

const SITE = 'https://www.arviik.in';

export const WELCOME_SUBJECT = 'Welcome to the ARVIIK Club';

export function welcomeEmailHtml(): string {
  const perk = (title: string, text: string) => `
    <tr>
      <td style="padding:0 0 14px 0;" valign="top" width="22">
        <div style="width:8px;height:8px;border-radius:8px;background:#a3e635;margin-top:6px;"></div>
      </td>
      <td style="padding:0 0 14px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:21px;color:#d6d3d1;">
        <strong style="color:#ffffff;">${title}</strong><br />${text}
      </td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>${WELCOME_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:#0c0a09;">
  <div style="display:none;max-height:0;overflow:hidden;">You're in. Early access to new drops, member-only offers and restock alerts.</div>
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
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;color:#a3e635;">MEMBERSHIP CONFIRMED</div>
              <h1 style="margin:10px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:28px;line-height:32px;font-weight:800;color:#ffffff;text-transform:uppercase;">Welcome to the Club</h1>
              <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#d6d3d1;">
                You're officially on the list. ARVIIK makes premium oversized streetwear in 240 GSM heavyweight cotton,
                with designs that say something. As a member, you'll hear from us first.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${perk('Early access to new drops', 'Be the first to know when a new design goes live.')}
                ${perk('Member-only offers', 'Offers we share with the Club before anyone else.')}
                ${perk('Restock alerts', 'Know when sold-out sizes come back.')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 8px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-left:2px solid #a3e635;padding:4px 0 4px 18px;">
                    <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;color:#a8a29e;">A NOTE FROM THE FOUNDERS</div>
                    <p style="margin:10px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:24px;color:#e7e5e4;">
                      ARVIIK started with one idea: what you wear should say something about who you are. Every design we drop is one
                      we'd wear ourselves, printed on fabric made to last. Thank you for being here this early. We can't wait to show you what's next.
                    </p>
                    <p style="margin:12px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#ffffff;font-weight:700;">
                      Aryan, Rishi &amp; Keyur
                      <span style="display:block;font-weight:400;font-size:11px;letter-spacing:2px;color:#a8a29e;margin-top:2px;">FOUNDERS, ARVIIK</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 36px 32px;">
              <a href="${SITE}/shop" style="display:inline-block;background:#a3e635;color:#0c0a09;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;text-decoration:none;padding:16px 32px;border-radius:999px;">SHOP THE LATEST DROP &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px;border-top:1px solid #292524;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:20px;color:#a8a29e;">
                Questions? Reply to this email, write to <a href="mailto:info@arviik.in" style="color:#ffffff;">info@arviik.in</a>
                or WhatsApp us at <a href="${whatsappLink('Hi ARVIIK!')}" style="color:#ffffff;">${WHATSAPP_DISPLAY}</a>.
              </p>
              <p style="margin:14px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:#78716c;">
                You're receiving this because you joined the ARVIIK Club at arviik.in. Don't want these emails? Just reply "unsubscribe".<br />
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

export function welcomeEmailText(): string {
  return [
    'WELCOME TO THE ARVIIK CLUB',
    '',
    "You're officially on the list. As a member, you'll hear from us first:",
    '- Early access to new drops',
    '- Member-only offers',
    '- Restock alerts when sold-out sizes come back',
    '',
    'A NOTE FROM THE FOUNDERS',
    "ARVIIK started with one idea: what you wear should say something about who you are. Every design we drop is one we'd wear ourselves, printed on fabric made to last. Thank you for being here this early. We can't wait to show you what's next.",
    '- Aryan, Rishi & Keyur, Founders, ARVIIK',
    '',
    `Shop the latest drop: ${SITE}/shop`,
    '',
    `Questions? Reply to this email, write to info@arviik.in or WhatsApp ${WHATSAPP_DISPLAY}.`,
    '',
    'You\'re receiving this because you joined the ARVIIK Club at arviik.in. Reply "unsubscribe" to stop these emails.',
    'ARVIIK · Ahmedabad, Gujarat, India',
  ].join('\n');
}
