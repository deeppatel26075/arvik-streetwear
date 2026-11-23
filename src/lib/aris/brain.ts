// Aris's free, built-in answer engine (no AI API, no cost).
//
// It reads the customer's latest message (plus a little recent context),
// works out what they're asking about, and composes a reply from the live
// catalog and the store's own policy values. Unknown questions get an honest
// "not sure" with the WhatsApp/email contacts instead of a guess.

import type { ArisProduct } from './knowledge';
import { SIZE_CHART, recommendSize } from '@/lib/sizeChart';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import {
  FLAT_SHIPPING_FEE_RUPEES,
  FLAT_COD_FEE_RUPEES,
  FREE_SHIPPING_THRESHOLD_RUPEES,
} from '@/lib/shippingConfig';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const WA = `[WhatsApp](${whatsappLink('Hi ARVIIK!')}) at ${WHATSAPP_DISPLAY}`;
const SIZE_ORDER = ['S', 'M', 'L', 'XL', 'XXL'];

/* ─────────────────────────── text helpers ─────────────────────────── */

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/'/g, '')
    .replace(/[^a-z0-9.₹\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

const has = (n: string, re: RegExp) => re.test(n);

function words(n: string): string[] {
  return n.trim().split(' ').filter(Boolean);
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/* ─────────────────────────── intents ─────────────────────────── */

type Intent =
  | 'greet' | 'thanks' | 'bye' | 'who' | 'about'
  | 'catalog' | 'price' | 'new' | 'colors'
  | 'sizeHelp' | 'sizeChart' | 'fit'
  | 'shippingCost' | 'deliveryTime' | 'international'
  | 'cod' | 'payment' | 'discount'
  | 'refund' | 'exchange' | 'cancel' | 'damaged'
  | 'track' | 'contact' | 'fabric' | 'care' | 'restock' | 'account' | 'howToOrder';

// Each intent: word/phrase cues (matched on word boundaries) and optional
// regexes. Hinglish cues are included for the most common questions.
const CUES: Record<Intent, (string | RegExp)[]> = {
  greet: [/^ (hi+|hey+|hello+|helo|hlo|yo|namaste|namaskar|hii+|sup|good (morning|afternoon|evening)) /],
  thanks: ['thanks', 'thank you', 'thank u', 'thx', 'ty', 'shukriya', 'dhanyavad', 'great thanks', 'cool thanks', 'ok thanks'],
  bye: [/^ (bye|goodbye|see you|see ya|tata|ok bye) /],
  who: ['who are you', 'what are you', 'your name', 'are you a bot', 'are you human', 'are you real', 'are you ai', 'who r u'],
  about: ['what is arviik', 'about arviik', 'about you guys', 'about the brand', 'who owns', 'your brand', 'tell me about arviik', 'where are you based', 'where is arviik'],
  catalog: ['products', 'collection', 'catalog', 'catalogue', 'what do you sell', 'what do you have', 'show me', 'whats in the shop', 'in the shop', 'tees', 'tshirts', 't shirts', 'designs', 'recommend', 'suggest a tee', 'available products', 'all products', 'what should i buy'],
  colors: ['colours', 'colors', 'what colour', 'what color', 'which colour', 'which color', 'colour options', 'color options', 'available colours', 'available colors', 'kaunse colour', 'konse colour'],
  price: ['price', 'prices', 'cost', 'how much', 'kitna', 'kitne', 'kitne ka', 'rate', 'cheap', 'cheapest', 'expensive', 'budget', 'under', 'below'],
  new: ['new', 'latest', 'new arrivals', 'new drop', 'trending', 'best seller', 'bestseller', 'popular'],
  sizeHelp: ['what size', 'which size', 'my size', 'size should', 'kaunsa size', 'konsa size', 'kon sa size', 'size suggest', 'suggest size', 'size for me', 'find size', 'size recommendation', 'recommend size', 'weight', 'wajan', 'vajan', 'height', 'kg', 'kgs'],
  sizeChart: ['size chart', 'size guide', 'measurement', 'measurements', 'chest', 'length', 'shoulder', 'inches', 'cm'],
  fit: ['fit', 'oversized', 'boxy', 'baggy', 'loose', 'size down', 'size up', 'true to size', 'run big', 'runs big', 'run small', 'runs small'],
  shippingCost: [/(how much|cost|price|charge|charges|fee|kitna|kitne).{0,20}(shipping|delivery)|(shipping|delivery).{0,20}(cost|charge|charges|fee|price|kitna|how much|free)/, 'shipping charge', 'shipping charges', 'shipping cost', 'shipping fee', 'delivery charge', 'delivery charges', 'delivery fee', 'free shipping', 'free delivery', 'shipping free', 'delivery free'],
  deliveryTime: ['how long', 'when will', 'kab', 'kab tak', 'kab aayega', 'kab ayega', 'delivery time', 'deliver', 'delivery', 'dispatch', 'ship', 'shipping', 'arrive', 'days', 'reach'],
  international: ['international', 'outside india', 'abroad', 'overseas', 'usa', 'uk', 'canada', 'dubai', 'uae', 'australia', 'worldwide', 'other countries', 'other country'],
  cod: ['cod', 'cash on delivery', 'cash'],
  payment: ['payment', 'pay', 'upi', 'card', 'credit card', 'debit card', 'net banking', 'netbanking', 'razorpay', 'wallet', 'gpay', 'paytm', 'phonepe', 'emi'],
  discount: ['discount', 'coupon', 'coupon code', 'promo code', 'discount code', 'offer code', 'offer', 'offers', 'promo', 'sale', 'deal', 'deals'],
  refund: ['refund', 'refunds', 'money back', 'paisa wapas', 'paise wapas', 'refundable', 'get my money'],
  exchange: ['exchange', 'exchanges', 'return', 'returns', 'returnable', 'replace size', 'change size', 'size change', 'wrong size', 'doesnt fit', 'not fitting', 'too big', 'too small', 'badalna', 'badal'],
  cancel: ['cancel', 'cancellation', 'cancelled', 'cancel my order', 'cancel order', 'cancel the order', 'cancel kar'],
  damaged: ['damaged', 'damage', 'defective', 'torn', 'hole', 'stain', 'wrong item', 'wrong product', 'missing item', 'faded', 'broken', 'kharab'],
  track: ['track', 'tracking', 'where is my order', 'order status', 'status of my order', 'track my order', 'kahan hai', 'kaha hai', 'not received', 'havent received', 'not delivered'],
  contact: ['contact', 'whatsapp', 'phone', 'call', 'number', 'email', 'mail', 'customer care', 'customer support', 'support', 'human', 'real person', 'agent', 'talk to', 'speak to', 'helpline'],
  fabric: ['fabric', 'material', 'cotton', 'gsm', 'quality', 'thick', 'heavy', 'heavyweight', 'polyester', 'kapda'],
  care: ['wash', 'washing', 'care', 'iron', 'ironing', 'dry', 'dryer', 'machine wash', 'shrink', 'shrinks', 'shrinkage', 'fade', 'bleach'],
  restock: ['restock', 'back in stock', 'sold out', 'out of stock', 'when available', 'notify me'],
  account: ['account', 'login', 'log in', 'sign up', 'signup', 'register', 'password', 'otp', 'profile'],
  howToOrder: ['how to order', 'how do i order', 'how can i order', 'place an order', 'place order', 'how to buy', 'how do i buy', 'checkout'],
};

// Broad intents whose cue words often appear inside more specific questions
// ("how many DAYS do I have to exchange", "SHIPPING charges").
const GENERIC: Intent[] = ['catalog', 'price', 'new', 'colors', 'deliveryTime', 'fit', 'contact', 'payment'];

function scoreIntents(n: string): [Intent, number][] {
  const scored: [Intent, number][] = [];
  for (const [intent, cues] of Object.entries(CUES) as [Intent, (string | RegExp)[]][]) {
    let s = 0;
    for (const c of cues) {
      // Multi-word phrases are stronger evidence than single words.
      if (typeof c === 'string' ? n.includes(` ${c} `) : c.test(n)) s += typeof c === 'string' ? Math.min(3, c.split(' ').length) : 3;
    }
    if (s > 0) scored.push([intent, s]);
  }
  // On equal score, a specific intent beats a generic one.
  const rank = (i: Intent) => (GENERIC.includes(i) ? 0 : 1);
  return scored.sort((a, b) => b[1] - a[1] || rank(b[0]) - rank(a[0]));
}

/* ─────────────────────────── entity extraction ─────────────────────────── */

const COLOR_SYNONYMS: Record<string, string[]> = {
  navy: ['navy', 'blue', 'dark blue', 'midnight'],
  cream: ['cream', 'beige', 'off white', 'offwhite', 'sand', 'ivory', 'nude', 'khaki'],
  terracotta: ['terracotta', 'red', 'rust', 'maroon', 'brick', 'orange'],
  brown: ['brown', 'chocolate', 'coffee', 'mocha'],
  black: ['black', 'dark'],
  white: ['white'],
  olive: ['olive', 'green'],
  grey: ['grey', 'gray', 'charcoal'],
};

function wantedColor(n: string): { key: string; word: string } | null {
  for (const [key, syns] of Object.entries(COLOR_SYNONYMS)) {
    const word = syns.find((s) => n.includes(` ${s} `));
    if (word) return { key, word };
  }
  return null;
}

function productMatchesColor(p: ArisProduct, colorKey: string): boolean {
  const c = (p.colorName || '').toLowerCase();
  return c.includes(colorKey) || (COLOR_SYNONYMS[colorKey] || []).some((s) => c.includes(s));
}

function findProducts(n: string, products: ArisProduct[]): ArisProduct[] {
  const msgWords = words(n);
  const hits = products.filter((p) => {
    const nameWords = words(normalize(p.name)).filter((w) => w.length >= 3);
    return nameWords.some((nw) =>
      msgWords.some((mw) => mw === nw || (nw.length >= 5 && mw.length >= 5 && editDistance(mw, nw) <= 1) || (nw.length >= 6 && mw.startsWith(nw.slice(0, 5)) && editDistance(mw, nw) <= 2))
    );
  });
  return hits;
}

function wantedSizes(original: string, n: string): string[] {
  const found = new Set<string>();
  for (const m of original.matchAll(/\b(XXL|2XL|XL|S|M|L)\b/g)) found.add(m[1] === '2XL' ? 'XXL' : m[1]);
  if (has(n, /\b(xxl|2xl|double xl)\b/)) found.add('XXL');
  if (has(n, /\b(xl|extra large)\b/)) found.add('XL');
  if (has(n, /\b(large|size l|in l|l size)\b/)) found.add('L');
  if (has(n, /\b(medium|size m|in m|m size)\b/)) found.add('M');
  if (has(n, /\b(small|size s|in s|s size)\b/)) found.add('S');
  return SIZE_ORDER.filter((x) => found.has(x));
}

function weightKg(n: string, prevAskedWeight: boolean): number | null {
  const kg = n.match(/(\d{2,3}(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms)\b/);
  if (kg) return parseFloat(kg[1]);
  const lbs = n.match(/(\d{2,3}(?:\.\d+)?)\s*(lb|lbs|pounds)\b/);
  if (lbs) return parseFloat(lbs[1]) * 0.4536;
  const labelled = n.match(/(weight|weigh|wajan|vajan)\D{0,12}(\d{2,3}(?:\.\d+)?)/);
  if (labelled) return parseFloat(labelled[2]);
  if (prevAskedWeight) {
    const bare = n.match(/^ (\d{2,3}(?:\.\d+)?) /);
    if (bare) return parseFloat(bare[1]);
  }
  return null;
}

const wantsRegularFit = (n: string) =>
  has(n, /\b(regular|normal|fitted|slim|not oversized|not baggy|less baggy|true fit)\b/);

/* ─────────────────────────── replies ─────────────────────────── */

function groupByName(products: ArisProduct[]): Map<string, ArisProduct[]> {
  const g = new Map<string, ArisProduct[]>();
  for (const p of products) {
    const k = p.name.trim().toLowerCase();
    g.set(k, [...(g.get(k) || []), p]);
  }
  return g;
}

function priceText(p: ArisProduct): string {
  return p.originalPrice ? `${rupees(p.price)} (was ${rupees(p.originalPrice)})` : rupees(p.price);
}

function productLine(p: ArisProduct): string {
  const stock = p.sizesInStock.length ? `sizes ${p.sizesInStock.join(', ')}` : 'sold out right now';
  return `- [${p.name}${p.colorName ? ` · ${p.colorName}` : ''}](${p.url}): ${priceText(p)}, ${stock}`;
}

function catalogReply(products: ArisProduct[], heading: string): string {
  if (!products.length) return `I can't load the collection right now. Have a look at the [Shop](/shop), or message us on ${WA}.`;
  return `${heading}\n${products.map(productLine).join('\n')}\nBrowse everything in the [Shop](/shop).`;
}

const SIZE_BANDS = 'Under 58 kg: **S** · 58–71 kg: **M** · 72–83 kg: **L** · 84–95 kg: **XL** · 96 kg+: **XXL**';

function sizeChartReply(): string {
  const rows = SIZE_CHART.map((r) => `- **${r.size}**: chest ${r.chest}", length ${r.length}", shoulder ${r.shoulder}"`).join('\n');
  return `Garment measurements (laid flat):\n${rows}\nFull chart in cm too: [Size Guide](/size-guide).`;
}

function stockLine(p: ArisProduct, size: string): string {
  if (p.sizesInStock.includes(size))
    return `Good news, **${size}** is in stock in [${p.name}${p.colorName ? ` · ${p.colorName}` : ''}](${p.url}).`;
  return p.sizesInStock.length
    ? `**${size}** is sold out in [${p.name}${p.colorName ? ` · ${p.colorName}` : ''}](${p.url}) right now. Available: ${p.sizesInStock.join(', ')}.`
    : `[${p.name}${p.colorName ? ` · ${p.colorName}` : ''}](${p.url}) is sold out right now.`;
}

function sizesLine(p: ArisProduct, asked: string[]): string {
  if (asked.length === 1) return stockLine(p, asked[0]);
  const label = `[${p.name}${p.colorName ? ` · ${p.colorName}` : ''}](${p.url})`;
  const yes = asked.filter((x) => p.sizesInStock.includes(x));
  const no = asked.filter((x) => !p.sizesInStock.includes(x));
  if (!no.length) return `Good news, ${yes.map((x) => `**${x}**`).join(' and ')} are both in stock in ${label}.`;
  if (!yes.length) return `${no.join(' and ')} are sold out in ${label} right now.${p.sizesInStock.length ? ` Available: ${p.sizesInStock.join(', ')}.` : ''}`;
  return `In ${label}, **${yes.join(', ')}** ${yes.length > 1 ? 'are' : 'is'} in stock, but ${no.join(', ')} ${no.length > 1 ? 'are' : 'is'} sold out.`;
}

const REPLIES: Record<Intent, () => string> = {
  greet: () =>
    "Hey! I'm **Aris**, ARVIIK's assistant. I can help you pick a size, find a tee, or answer questions about shipping, exchanges and orders. What are you looking for?",
  thanks: () => 'Anytime! Anything else I can help with?',
  bye: () => 'Take care, and wear your identity!',
  who: () =>
    "I'm **Aris**, ARVIIK's virtual assistant. I answer from the store's own info: products, sizing, shipping, exchanges and orders. For anything I can't handle, the team is on " + WA + '.',
  about: () =>
    'ARVIIK is an Indian streetwear label based in Ahmedabad, making premium oversized printed tees in 240 GSM heavyweight cotton. Every design is meant to say something: **Wear Your Identity**. More in [Our Story](/about).',
  catalog: () => '',
  colors: () => '',
  price: () => '',
  new: () => '',
  sizeHelp: () =>
    `Tell me your weight and I'll suggest a size. Quick guide for our oversized fit:\n${SIZE_BANDS}\nPrefer a more regular fit? Go one size down. Full measurements: [Size Guide](/size-guide).`,
  sizeChart: sizeChartReply,
  fit: () =>
    "All ARVIIK tees have an **oversized, boxy fit**. Order your usual size for the oversized look, or one size down for a more regular fit. Tell me your weight and I'll suggest a size.",
  shippingCost: () =>
    `Shipping is **free** on orders of ${rupees(FREE_SHIPPING_THRESHOLD_RUPEES)} and above. Below that it's a flat ${rupees(FLAT_SHIPPING_FEE_RUPEES)}. Cash on Delivery adds a ${rupees(FLAT_COD_FEE_RUPEES)} COD fee. Details: [Shipping Policy](/shipping-policy).`,
  deliveryTime: () =>
    'Orders are usually dispatched within **24–48 hours** and delivered in **3–5 business days** across India; remote pincodes can take a little longer. You can follow your order on [Track Order](/track-order).',
  international: () =>
    "Right now we ship **only within India**. We'll share it here first if that changes.",
  cod: () =>
    `Yes, **Cash on Delivery** is available on serviceable pincodes. It carries a flat ${rupees(FLAT_COD_FEE_RUPEES)} COD fee, shown at checkout. You'll see whether COD is available for your pincode at checkout.`,
  payment: () =>
    'You can pay online through **Razorpay** (UPI, cards, net banking and wallets), or choose **Cash on Delivery** where available. Payments are processed securely by Razorpay.',
  discount: () =>
    "Any offer you're eligible for is shown at checkout before you pay. I can't apply or create coupon codes myself.",
  refund: () =>
    'ARVIIK **doesn’t offer refunds** on delivered orders, but you can **exchange for a different size** within 7 days of delivery (unworn, unwashed, tags on). The one exception: a prepaid order cancelled within **2 hours** of confirmation is refunded in full. Details: [Exchange Policy](/refund-policy).',
  exchange: () =>
    'You can **exchange for a different size** of the same design within **7 days of delivery**. The tee must be unworn, unwashed, with tags and packaging intact. Pickup is free, and the new size arrives in 7–10 working days after a quick quality check. To start, email info@arviik.in or use the [Contact page](/contact) with your order number. We don’t offer refunds. [Exchange Policy](/refund-policy).',
  cancel: () =>
    "You can cancel within **2 hours** of order confirmation by emailing info@arviik.in with your order number. Prepaid orders cancelled in that window are refunded in full. After 2 hours an order can't be cancelled, but you can exchange the size once it's delivered.",
  damaged: () =>
    `Sorry about that! Message us within **48 hours of delivery** with your order number and a photo, on ${WA} or at info@arviik.in. We'll send a **free replacement**, or if it's out of stock, an exchange for another product of equal value.`,
  track: () =>
    `You can see the live status of every order on [Track Order](/track-order) after logging in. I can't see orders myself, so if something looks wrong, message the team on ${WA} with your order number.`,
  contact: () =>
    `You can reach the ARVIIK team on ${WA}, or email **info@arviik.in**. There's also the [Contact page](/contact).`,
  fabric: () =>
    'Our tees are **240 GSM heavyweight combed cotton** (French terry), bio-washed and pre-shrunk, so they feel soft, hold their shape and keep their fit wash after wash.',
  care: () =>
    'To keep it looking new: turn it **inside out**, wash **cold** on a gentle cycle with mild detergent and no bleach, **air dry** in the shade, and never iron directly on the print. It’s pre-shrunk, so it keeps its fit.',
  restock: () =>
    `Popular sizes do come back, but I can't promise dates. Message the team on ${WA} and ask to be told when your size is back.`,
  account: () =>
    'You need an account to place an order. [Log in or sign up here](/login). If you forgot your password, use "Forgot password" on the login page. Once logged in, your orders show up in your account and on [Track Order](/track-order).',
  howToOrder: () =>
    'Pick a tee in the [Shop](/shop), choose your size, tap **Add to Bag**, then check out. You’ll need to log in, add your address, and pay online or choose Cash on Delivery.',
};

const FALLBACK = () =>
  `I'm not sure about that one. I can help with **sizing**, **products**, **shipping**, **exchanges** and **orders**. For anything else, the team is on ${WA} or at info@arviik.in.`;

/* ─────────────────────────── main ─────────────────────────── */

export function arisAnswer(turns: ChatTurn[], products: ArisProduct[]): string {
  const last = turns[turns.length - 1]?.content || '';
  const n = normalize(last);
  const prevAssistant = [...turns].reverse().find((t, i) => i > 0 && t.role === 'assistant')?.content || '';
  const askedWeight = /tell me your weight|your weight/i.test(prevAssistant);

  const scored = scoreIntents(n);
  const intents = scored.map(([i]) => i);
  const sizes = wantedSizes(last, n);
  // "that size" / "my size" → the size Aris recommended earlier in the chat.
  if (!sizes.length && /\b(that|this|my|the same|same|recommended|suggested) size\b/.test(n)) {
    const rec = prevAssistant.match(/go with \*\*(XXL|XL|S|M|L)\*\*/);
    if (rec) sizes.push(rec[1]);
  }
  const size = sizes[0] ?? null;
  const color = wantedColor(n);
  const weight = weightKg(n, askedWeight);

  // Product mentioned now, or the one being discussed a turn or two ago.
  let matched = findProducts(n, products);
  if (!matched.length && (size || weight || intents.includes('price') || intents.includes('restock') || /\b(it|this|that|this one|that one|available)\b/.test(n))) {
    for (const t of [...turns].slice(0, -1).reverse().slice(0, 4)) {
      const prev = findProducts(normalize(t.content), products);
      if (prev.length) {
        matched = prev;
        break;
      }
    }
  }
  if (matched.length > 1 && color) {
    const byColor = matched.filter((p) => productMatchesColor(p, color.key));
    if (byColor.length) matched = byColor;
  }

  // 1) Size recommendation from weight.
  if (weight) {
    if (weight < 30 || weight > 200) return "That weight doesn't look right. Could you double-check it in kg?";
    const fit = wantsRegularFit(n) ? 'regular' : 'oversized';
    const rec = recommendSize(weight, fit);
    const alt = fit === 'oversized' && rec !== 'S' ? SIZE_ORDER[SIZE_ORDER.indexOf(rec) - 1] : null;
    let reply = `At about **${Math.round(weight)} kg**, go with **${rec}** for ${fit === 'oversized' ? 'our signature oversized fit' : 'a more regular fit'}.`;
    if (alt) reply += ` Want it less baggy? Try **${alt}**.`;
    if (matched.length === 1) reply += `\n${stockLine(matched[0], rec)}`;
    else reply += ' [Size Guide](/size-guide)';
    return reply;
  }

  // 2) A specific product (optionally with a size or price question).
  if (matched.length) {
    const groups = [...groupByName(matched).values()];
    const parts: string[] = [];
    for (const group of groups) {
      if (sizes.length) {
        parts.push(group.map((p) => sizesLine(p, sizes)).join('\n'));
      } else if (group.length > 1) {
        parts.push(`**${group[0].name}** comes in ${group.length} colours:\n${group.map(productLine).join('\n')}`);
      } else {
        const p = group[0];
        const firstLine = p.description.split(/(?<=\.)\s/)[0].slice(0, 180);
        const about = firstLine.length >= 25 && firstLine.toLowerCase() !== p.name.toLowerCase() ? ` ${firstLine}` : '';
        parts.push(`${productLine(p).slice(2)}.${about}`);
      }
    }
    if (color && !matched.some((p) => productMatchesColor(p, color.key))) {
      parts.push(`It isn't available in ${color.word} right now.`);
    }
    return parts.join('\n\n');
  }

  // 3) Colour search across the catalog.
  if (color && (intents.length === 0 || intents.some((i) => ['catalog', 'price', 'new', 'restock'].includes(i)) || /\b(any|have|got|in|colou?r)\b/.test(n))) {
    const byColor = products.filter((p) => productMatchesColor(p, color.key));
    if (byColor.length) return catalogReply(byColor, `Here's what we have in ${color.word}:`);
    const colours = [...new Set(products.map((p) => p.colorName).filter(Boolean))];
    return `We don't have anything in ${color.word} right now. Current colours: ${colours.join(', ') || 'see the shop'}. [Shop all](/shop)`;
  }

  // 4) Catalog-wide questions. A price cap ("under 1000") is the most
  // specific thing asked, so handle it before a plain listing.
  const top = intents[0];
  const cap = n.match(/(under|below|less than|within|upto|up to|max)\s*(rs\.?|₹|inr)?\s*(\d{3,5})/);
  if (cap && (top === 'catalog' || top === 'price' || top === 'new' || !top)) {
    const limit = parseInt(cap[3], 10);
    const fits = products.filter((p) => p.price <= limit);
    const lo = products.length ? Math.min(...products.map((p) => p.price)) : 0;
    return fits.length
      ? catalogReply(fits, `Tees at ${rupees(limit)} or less:`)
      : `Nothing at ${rupees(limit)} or less right now. Our tees start at ${rupees(lo)}. [Shop all](/shop)`;
  }
  if (top === 'colors') {
    const byColour = new Map<string, ArisProduct[]>();
    for (const p of products) {
      if (!p.colorName) continue;
      const k = p.colorName.toLowerCase();
      byColour.set(k, [...(byColour.get(k) || []), p]);
    }
    if (!byColour.size) return `See every colourway in the [Shop](/shop).`;
    const lines = [...byColour.values()].map(
      (ps) => `- **${ps[0].colorName}**: ${ps.map((p) => `[${p.name}](${p.url})`).join(', ')}`
    );
    return `Colours in the shop right now:\n${lines.join('\n')}`;
  }
  if (top === 'catalog' || top === 'new') {
    return catalogReply(products, top === 'new' ? 'Our latest drops:' : `Here's what's in the shop right now:`);
  }
  if (top === 'price' && !intents.slice(1, 2).some((i) => ['shippingCost', 'cod', 'deliveryTime'].includes(i))) {
    if (!products.length) return catalogReply(products, '');
    const prices = products.map((p) => p.price);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    const under = n.match(/(under|below|less than|within)\s*₹?\s*(\d{3,5})/);
    if (under) {
      const cap = parseInt(under[2], 10);
      const fits = products.filter((p) => p.price <= cap);
      return fits.length ? catalogReply(fits, `Tees at ${rupees(cap)} or less:`) : `Nothing under ${rupees(cap)} right now. Our tees start at ${rupees(lo)}. [Shop all](/shop)`;
    }
    return catalogReply(products, lo === hi ? `Our tees are ${rupees(lo)}:` : `Our tees range from ${rupees(lo)} to ${rupees(hi)}:`);
  }

  // 5) Policy / help intents: answer the top one, plus a second only when it
  // was clearly asked too and its answer isn't already covered by the first.
  if (top) {
    const first = REPLIES[top]();
    const [second, secondScore] = scored[1] || [];
    const COVERED: Partial<Record<Intent, Intent[]>> = {
      refund: ['exchange', 'cancel'],
      exchange: ['refund'],
      cancel: ['refund', 'exchange'],
      shippingCost: ['cod', 'deliveryTime'],
      cod: ['payment', 'shippingCost'],
      payment: ['cod'],
      sizeHelp: ['fit', 'sizeChart'],
      fit: ['sizeHelp'],
      damaged: ['contact', 'exchange'],
      track: ['contact', 'deliveryTime'],
      greet: [],
    };
    const skipSecond =
      !second ||
      (secondScore ?? 0) < 2 ||
      ['greet', 'thanks', 'bye', 'catalog', 'price', 'new'].includes(second) ||
      (COVERED[top] || []).includes(second) ||
      top === 'greet' || top === 'thanks';
    const answers = [first];
    if (!skipSecond) answers.push(REPLIES[second as Intent]());
    return answers.filter(Boolean).join('\n\n') || FALLBACK();
  }

  return FALLBACK();
}
