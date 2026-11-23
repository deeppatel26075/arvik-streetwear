// Single source of truth for customer-facing contact details.
// Change the number here and every WhatsApp button on the site follows.

/** WhatsApp support number: country code + number, digits only (no +, spaces). */
export const WHATSAPP_NUMBER = '918780236742';

/** Human-readable version for display. */
export const WHATSAPP_DISPLAY = '+91 87802 36742';

/** Phone number shown on the site (same line as WhatsApp). */
export const PHONE_DISPLAY = WHATSAPP_DISPLAY;
/** tel: link for tap-to-call on phones. */
export const PHONE_TEL = `tel:+${WHATSAPP_NUMBER}`;

/** wa.me chat link, optionally with a pre-filled message. */
export function whatsappLink(message?: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
