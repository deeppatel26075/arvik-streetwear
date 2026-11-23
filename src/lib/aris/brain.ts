// Aris's free, built-in answer engine (no AI API, no cost).
//
// It reads the customer's latest message (plus recent context), works out
// what they're asking, and composes a reply from the live catalog and the
// store's own policy values. It aims to feel conversational: it forgives
// typos, answers several questions in one message, remembers the customer's
// name and the product being discussed, understands "yes" to its own
// suggestions, and offers tap-to-ask follow-ups. Unknown questions get an
// honest "not sure" with the WhatsApp/email contacts instead of a guess.
//
// Follow-up chips travel at the end of the reply text after CHIPS_MARKER;
// the chat panel strips them off and renders them as buttons.

import type { ArisProduct } from './knowledge';
import { SIZE_CHART, recommendSize } from '@/lib/sizeChart';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import {
  FLAT_SHIPPING_FEE_RUPEES,
  FLAT_COD_FEE_RUPEES,
  FREE_SHIPPING_THRESHOLD_RUPEES,
} from '@/lib/shippingConfig';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export const CHIPS_MARKER = '\n::chips::';

type Reply = { text: string; chips?: string[] };

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

// Stable "random" pick so replies vary between messages without being
// nondeterministic for the same message.
function pick<T>(options: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

const titleCase = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/* ─────────────────────────── intents ─────────────────────────── */

type Intent =
  | 'greet' | 'thanks' | 'bye' | 'who' | 'about' | 'smalltalk' | 'compliment' | 'ack' | 'frustrated'
  | 'yes' | 'no'
  | 'catalog' | 'price' | 'new' | 'colors' | 'recommend' | 'compare' | 'style' | 'gift'
  | 'sizeHelp' | 'sizeChart' | 'fit'
  | 'shippingCost' | 'deliveryTime' | 'international'
  | 'cod' | 'payment' | 'discount'
  | 'refund' | 'exchange' | 'cancel' | 'damaged'
  | 'track' | 'contact' | 'fabric' | 'care' | 'restock' | 'account' | 'howToOrder';

// Each intent: word/phrase cues (matched on word boundaries) and optional
// regexes. Hinglish cues are included for the most common questions.
const CUES: Record<Intent, (string | RegExp)[]> = {
  greet: [/^ (hi+|hey+|hello+|helo|hlo|yo|namaste|namaskar|hii+|sup|good (morning|afternoon|evening)) /],
  thanks: ['thanks', 'thank you', 'thank u', 'thx', 'ty', 'shukriya', 'dhanyavad', 'great thanks', 'cool thanks', 'ok thanks', 'thanks a lot'],
  bye: [/^ (bye|goodbye|see you|see ya|tata|ok bye|bye bye|good night|gn) /],
  who: ['who are you', 'what are you', 'your name', 'are you a bot', 'are you human', 'are you real', 'are you ai', 'who r u', 'what can you do', 'what do you do', 'how can you help'],
  about: ['what is arviik', 'about arviik', 'about you guys', 'about the brand', 'who owns', 'your brand', 'tell me about arviik', 'where are you based', 'where is arviik', 'who made arviik', 'founder', 'founders'],
  smalltalk: ['how are you', 'how r u', 'how are u', 'hows it going', 'how is it going', 'kaise ho', 'kya haal', 'whats up', 'wassup', 'how you doing', 'how is your day', 'hows your day'],
  compliment: ['you are smart', 'youre smart', 'good bot', 'smart bot', 'you are good', 'youre good', 'well done', 'nice bot', 'you are awesome', 'youre awesome', 'very helpful', 'so helpful', 'that helps', 'that helped', 'love this', 'love it'],
  ack: [/^ (ok|okay|okk+|k|kk|hmm+|cool|alright|got it|fine|nice|great|achha|accha|acha|theek hai|thik hai|oh|oh ok|i see) $/],
  frustrated: ['useless', 'not helpful', 'stupid', 'bakwas', 'you dont understand', 'wrong answer', 'not what i asked', 'dumb', 'pathetic', 'irritating', 'makes no sense'],
  yes: [/^ (yes|yeah|yep|yup|ya|yaa|haan|han|ha|haa|sure|ok sure|please|yes please|sure thing|go ahead|of course|ofc|definitely|why not|ok please|yes sure|ok yes) $/],
  no: [/^ (no|nope|nah|na|nahi|nahin|no thanks|no thank you|not now|its ok|its fine|thats all|nothing|nothing else) $/],
  catalog: ['products', 'collection', 'catalog', 'catalogue', 'what do you sell', 'what do you have', 'show me', 'whats in the shop', 'in the shop', 'tees', 'tshirts', 't shirts', 'tshirt', 'designs', 'available products', 'all products', 'shop the drop'],
  colors: ['colours', 'colors', 'what colour', 'what color', 'which colour', 'which color', 'colour options', 'color options', 'available colours', 'available colors', 'kaunse colour', 'konse colour'],
  price: ['price', 'prices', 'cost', 'how much', 'kitna', 'kitne', 'kitne ka', 'rate', 'cheap', 'cheapest', 'expensive', 'budget', 'under', 'below'],
  new: ['new', 'latest', 'new arrivals', 'new drop', 'trending', 'best seller', 'bestseller', 'best sellers', 'popular'],
  recommend: ['recommend', 'recommendation', 'suggest', 'suggestion', 'which one should', 'what should i buy', 'what should i get', 'help me choose', 'help me pick', 'best one', 'your favourite', 'your favorite', 'your pick', 'must have', 'best tee', 'best design', 'which one do you recommend', 'kaunsa lu', 'konsa lu', 'kya lu'],
  compare: ['difference', 'compare', 'comparison', 'vs', 'versus', 'which is better', 'better one', 'or the'],
  style: ['style', 'styling', 'how to wear', 'how do i wear', 'wear it with', 'wear with', 'pair with', 'pair it', 'match with', 'goes with', 'outfit', 'outfits', 'look good', 'occasion', 'college', 'date night', 'party', 'jeans', 'cargo', 'cargos', 'sneakers', 'jacket', 'layer', 'layering'],
  gift: ['gift', 'gifting', 'present', 'birthday', 'anniversary', 'for my brother', 'for my friend', 'for my boyfriend', 'for my husband', 'for my dad', 'for my son', 'for my sister', 'for my girlfriend', 'surprise'],
  sizeHelp: ['what size', 'which size', 'my size', 'size should', 'kaunsa size', 'konsa size', 'kon sa size', 'size suggest', 'suggest size', 'size for me', 'find size', 'find my size', 'size recommendation', 'recommend size', 'weight', 'wajan', 'vajan', 'height', 'kg', 'kgs', 'tall', 'feet'],
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
  contact: ['contact', 'whatsapp', 'phone', 'call', 'number', 'email', 'mail', 'customer care', 'customer support', 'support', 'human', 'real person', 'agent', 'talk to', 'speak to', 'helpline', 'talk to a human'],
  fabric: ['fabric', 'material', 'cotton', 'gsm', 'quality', 'thick', 'heavy', 'heavyweight', 'polyester', 'kapda', 'see through', 'transparent'],
  care: ['wash', 'washing', 'care', 'iron', 'ironing', 'dry', 'dryer', 'machine wash', 'shrink', 'shrinks', 'shrinkage', 'fade', 'bleach'],
  restock: ['restock', 'back in stock', 'sold out', 'out of stock', 'when available', 'notify me'],
  account: ['account', 'login', 'log in', 'sign up', 'signup', 'register', 'password', 'otp', 'profile', 'forgot password'],
  howToOrder: ['how to order', 'how do i order', 'how can i order', 'place an order', 'place order', 'how to buy', 'how do i buy', 'checkout'],
};

// Broad intents whose cue words often appear inside more specific questions
// ("how many DAYS do I have to exchange", "SHIPPING charges").
const GENERIC: Intent[] = ['catalog', 'price', 'new', 'colors', 'deliveryTime', 'fit', 'contact', 'payment', 'style'];

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

/* ─────────────────────────── typo correction ─────────────────────────── */

// Everyday words that must never be "corrected" into a store keyword.
const COMMON = `the and for are but not you your yours all any can had her was one our out day get has him his how man new now old see two way who boy did its let put say she too use what when where which while with will would there their them then than that this those these have from they been were more some time very just like make know take come could should about after again also back because before being best both each even every first give good great here into last long look many most much must need never only other over same such tell thing think through under well want went work year able ever made please thanks thank really still sure maybe today tomorrow yesterday week month order orders item items shirt shirts tee tees size sizes small medium large color colour colors colours black white brown green blue grey gray cream navy olive design designs print printed graphic brand arviik aris store shop online website site india indian ahmedabad gujarat money price prices rupees free fast slow quick help hello hey thanks okay fine nice cool yes yeah know going doing wear wearing worn wash washed bought buying buy cost does doesnt dont cant wont isnt arent didnt hasnt havent wasnt about above below between friend friends brother sister father mother family people person someone something anything everything nothing other another again always often sometimes usually confused interested here happy sad bored ready sorry done lost curious excited broke busy male female girl student new fine good back tired asking looking searching trying planning`.split(/\s+/);

let VOCAB: Set<string> | null = null;
function vocab(products: ArisProduct[]): Set<string> {
  if (!VOCAB) {
    VOCAB = new Set(COMMON);
    for (const cues of Object.values(CUES))
      for (const c of cues) if (typeof c === 'string') for (const w of c.split(' ')) if (w.length >= 3) VOCAB.add(w);
    for (const syns of Object.values(COLOR_SYNONYMS)) for (const s of syns) for (const w of s.split(' ')) VOCAB.add(w);
  }
  const v = new Set(VOCAB);
  for (const p of products) for (const w of words(normalize(p.name))) if (w.length >= 3) v.add(w);
  return v;
}

// "shiping charjes" → "shipping charges", "exchnage" → "exchange".
function correctTypos(n: string, products: ArisProduct[]): string {
  const v = vocab(products);
  const fixed = words(n).map((w) => {
    if (w.length < 5 || v.has(w) || /\d/.test(w)) return w;
    const maxD = w.length >= 7 ? 2 : 1;
    let best: string | null = null;
    let bestD = maxD + 1;
    let tie = false;
    for (const cand of v) {
      if (Math.abs(cand.length - w.length) > maxD) continue;
      const d = editDistance(w, cand);
      if (d < bestD) {
        best = cand;
        bestD = d;
        tie = false;
      } else if (d === bestD) tie = true;
    }
    return best && bestD <= maxD && !tie ? best : w;
  });
  return ` ${fixed.join(' ')} `;
}

/* ─────────────────────────── entity extraction ─────────────────────────── */

const COLOR_SYNONYMS: Record<string, string[]> = {
  navy: ['navy', 'blue', 'dark blue', 'midnight'],
  cream: ['cream', 'beige', 'off white', 'offwhite', 'sand', 'ivory', 'nude', 'khaki'],
  terracotta: ['terracotta', 'red', 'rust', 'maroon', 'brick', 'orange'],
  brown: ['brown', 'chocolate', 'coffee', 'mocha'],
  black: ['black'],
  white: ['white'],
  olive: ['olive', 'green'],
  grey: ['grey', 'gray', 'charcoal'],
};
const DARK_COLOURS = ['navy', 'terracotta', 'brown', 'black', 'olive', 'grey'];
const LIGHT_COLOURS = ['cream', 'white'];

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

const isDark = (p: ArisProduct) => DARK_COLOURS.some((k) => productMatchesColor(p, k));
const isLight = (p: ArisProduct) => LIGHT_COLOURS.some((k) => productMatchesColor(p, k));

function findProducts(n: string, products: ArisProduct[]): ArisProduct[] {
  const msgWords = words(n);
  return products.filter((p) => {
    const nameWords = words(normalize(p.name)).filter((w) => w.length >= 3);
    return nameWords.some((nw) =>
      msgWords.some((mw) => mw === nw || (nw.length >= 5 && mw.length >= 5 && editDistance(mw, nw) <= 1) || (nw.length >= 6 && mw.startsWith(nw.slice(0, 5)) && editDistance(mw, nw) <= 2))
    );
  });
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

// 5'10", 5 ft 10, 5.10 feet, 178 cm → centimetres.
function heightCm(original: string): number | null {
  const t = original.toLowerCase();
  const cm = t.match(/(\d{3})\s*(cm|cms|centimet)/);
  if (cm) return parseInt(cm[1], 10);
  const ft = t.match(/\b([4-7])\s*(?:'|’|ft|feet|foot|\.)\s*(\d{1,2})?\s*(?:"|”|in|inch|inches)?/);
  if (ft && (/'|’|ft|feet|foot/.test(ft[0]) || /\b(height|tall)\b/.test(t))) {
    const inches = parseInt(ft[1], 10) * 12 + (ft[2] ? Math.min(11, parseInt(ft[2], 10)) : 0);
    return Math.round(inches * 2.54);
  }
  // "5 11 and 80 kg": a bare feet/inches pair next to a weight.
  const bare = t.match(/\b([4-7])\s+(\d{1,2})\b/);
  if (bare && /\bkg|kgs|weigh/.test(t) && parseInt(bare[2], 10) <= 11) {
    return Math.round((parseInt(bare[1], 10) * 12 + parseInt(bare[2], 10)) * 2.54);
  }
  return null;
}

const wantsRegularFit = (n: string) =>
  has(n, /\b(regular|normal|fitted|slim|not oversized|not baggy|less baggy|true fit)\b/);

// "my name is Rohan", "I'm Rohan", "call me Rohan" (anywhere in the chat).
function customerName(turns: ChatTurn[], products: ArisProduct[]): string | null {
  const v = vocab(products);
  for (const t of [...turns].reverse()) {
    if (t.role !== 'user') continue;
    const m =
      t.content.match(/\b(?:my name is|my names|myself|call me|this is)\s+([a-z]{2,15})\b/i) ||
      (words(normalize(t.content)).length <= 3 ? t.content.match(/^\s*(?:hi|hey|hello)?[,\s]*(?:i am|i'm|im)\s+([a-z]{2,15})\s*[.!]?\s*$/i) : null);
    if (m && !v.has(m[1].toLowerCase())) return titleCase(m[1]);
  }
  return null;
}

/* ─────────────────────────── reply building blocks ─────────────────────────── */

function groupByName(products: ArisProduct[]): Map<string, ArisProduct[]> {
  const g = new Map<string, ArisProduct[]>();
  for (const p of products) {
    const k = p.name.trim().toLowerCase();
    g.set(k, [...(g.get(k) || []), p]);
  }
  return g;
}

const label = (p: ArisProduct) => `[${p.name}${p.colorName ? ` · ${p.colorName}` : ''}](${p.url})`;

function priceText(p: ArisProduct): string {
  return p.originalPrice ? `${rupees(p.price)} (was ${rupees(p.originalPrice)})` : rupees(p.price);
}

function productLine(p: ArisProduct): string {
  const stock = p.sizesInStock.length ? `sizes ${p.sizesInStock.join(', ')}` : 'sold out right now';
  return `- ${label(p)}: ${priceText(p)}, ${stock}`;
}

function catalogReply(products: ArisProduct[], heading: string): string {
  if (!products.length) return `I can't load the collection right now. Have a look at the [Shop](/shop), or message us on ${WA}.`;
  return `${heading}\n${products.map(productLine).join('\n')}`;
}

function describe(p: ArisProduct): string {
  const firstLine = (p.description || '').split(/(?<=\.)\s/)[0].slice(0, 180);
  return firstLine.length >= 25 && firstLine.toLowerCase() !== p.name.toLowerCase() ? ` ${firstLine}` : '';
}

// Best picks: most sizes in stock first, then the bigger saving; one per design.
function topPicks(products: ArisProduct[], count: number): ArisProduct[] {
  const ranked = products
    .filter((p) => p.sizesInStock.length)
    .sort(
      (a, b) =>
        b.sizesInStock.length - a.sizesInStock.length ||
        (b.originalPrice ? b.originalPrice - b.price : 0) - (a.originalPrice ? a.originalPrice - a.price : 0)
    );
  const seen = new Set<string>();
  const out: ArisProduct[] = [];
  for (const p of ranked) {
    const k = p.name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length === count) break;
  }
  return out;
}

const SIZE_BANDS = 'Under 58 kg: **S** · 58–71 kg: **M** · 72–83 kg: **L** · 84–95 kg: **XL** · 96 kg+: **XXL**';

function sizeChartReply(): string {
  const rows = SIZE_CHART.map((r) => `- **${r.size}**: chest ${r.chest}", length ${r.length}", shoulder ${r.shoulder}"`).join('\n');
  return `Garment measurements (laid flat):\n${rows}\nFull chart in cm too: [Size Guide](/size-guide).`;
}

function stockLine(p: ArisProduct, size: string): string {
  if (p.sizesInStock.includes(size)) return `Good news, **${size}** is in stock in ${label(p)}.`;
  return p.sizesInStock.length
    ? `**${size}** is sold out in ${label(p)} right now. Available: ${p.sizesInStock.join(', ')}.`
    : `${label(p)} is sold out right now.`;
}

function sizesLine(p: ArisProduct, asked: string[]): string {
  if (asked.length === 1) return stockLine(p, asked[0]);
  const yes = asked.filter((x) => p.sizesInStock.includes(x));
  const no = asked.filter((x) => !p.sizesInStock.includes(x));
  if (!no.length) return `Good news, ${yes.map((x) => `**${x}**`).join(' and ')} are both in stock in ${label(p)}.`;
  if (!yes.length) return `${no.join(' and ')} are sold out in ${label(p)} right now.${p.sizesInStock.length ? ` Available: ${p.sizesInStock.join(', ')}.` : ''}`;
  return `In ${label(p)}, **${yes.join(', ')}** ${yes.length > 1 ? 'are' : 'is'} in stock, but ${no.join(', ')} ${no.length > 1 ? 'are' : 'is'} sold out.`;
}

// Offers Aris makes at the end of a reply. A "yes" on the next turn runs the
// mapped question, so the conversation flows like a real chat.
const OFFERS = {
  size: { ask: 'Want me to suggest a size?', run: 'which size should i get' },
  shop: { ask: 'Want to see everything in the shop?', run: 'show me the collection' },
  pick: { ask: 'Want me to pick one for you?', run: 'which one do you recommend' },
  style: { ask: 'Want a few styling ideas too?', run: 'how should i style it' },
  exchange: { ask: 'Want to know how exchanges work?', run: 'how do exchanges work' },
} as const;

const CHIPS = {
  start: ['Find my size', 'Show the collection', 'Which one do you recommend?'],
  afterSize: ['Size chart', 'Which one do you recommend?', 'How do exchanges work?'],
  afterProduct: ['Suggest my size', 'How do I style it?', 'Delivery time?'],
  afterCatalog: ['Which one do you recommend?', 'What colours do you have?', 'Find my size'],
  afterShipping: ['Is COD available?', 'How long does delivery take?', 'How do exchanges work?'],
  afterPolicy: ['Talk to a human', 'Shipping charges', 'Find my size'],
  fallback: ['Find my size', 'Show the collection', 'Talk to a human'],
};

const REPLIES: Record<Intent, (name: string | null, seed: string) => Reply> = {
  greet: (name, seed) => ({
    text: `${pick(['Hey', 'Hi', 'Hello'], seed)}${name ? ` ${name}` : ''}! I'm **Aris**, ARVIIK's assistant. ${pick(
      [
        'I can help you pick a size, find a tee you’ll love, or sort out shipping, exchanges and orders. What are you looking for today?',
        'Looking for a new tee, help with sizing, or something about an order? Just ask.',
        'Ask me anything about our tees, sizing, delivery or exchanges. What can I do for you?',
      ],
      seed
    )}`,
    chips: CHIPS.start,
  }),
  thanks: (name, seed) => ({
    text: pick([`Anytime${name ? `, ${name}` : ''}! Anything else I can help with?`, 'Happy to help! Need anything else?', `You're welcome${name ? `, ${name}` : ''}! What else can I do for you?`], seed),
  }),
  bye: (name, seed) => ({ text: pick([`Take care${name ? `, ${name}` : ''}, and wear your identity!`, 'Bye for now! I’m here whenever you need me.', 'See you soon! Happy shopping.'], seed) }),
  who: () => ({
    text: `I'm **Aris**, ARVIIK's shopping assistant. I can:\n- suggest your size from your weight (and height)\n- show you tees by colour, price or style\n- compare designs and pick one for you\n- answer shipping, payment, exchange and order questions\nFor anything I can't handle, the team is on ${WA}.`,
    chips: CHIPS.start,
  }),
  about: () => ({
    text: 'ARVIIK is an Indian streetwear label based in Ahmedabad, making premium oversized printed tees in 240 GSM heavyweight cotton. Every design is meant to say something: **Wear Your Identity**. More in [Our Story](/about).',
    chips: ['Show the collection', 'What is the fabric like?', 'Find my size'],
  }),
  smalltalk: (name, seed) => ({
    text: pick(
      [
        `Doing great, thanks for asking${name ? `, ${name}` : ''}! Ready to help you find something good. What are you shopping for?`,
        'All good here, just looking after the shop. How can I help you today?',
        'Pretty good! Fresh drops in the shop and plenty to talk about. What can I help you with?',
      ],
      seed
    ),
    chips: CHIPS.start,
  }),
  compliment: (name, seed) => ({ text: pick(['That made my day! Anything else I can help with?', `Thank you${name ? `, ${name}` : ''}! Happy to help anytime.`, 'Appreciate it! What else can I do for you?'], seed) }),
  ack: (_n, seed) => ({ text: pick(['Great! Anything else you’d like to know?', 'Got it. Let me know if there’s anything else.', 'Cool! I’m here if you need anything else.'], seed), chips: CHIPS.start }),
  frustrated: () => ({
    text: `Sorry about that, I didn't get it right. Could you put it another way? If it's easier, the team can help you directly on ${WA} or at info@arviik.in.`,
    chips: CHIPS.fallback,
  }),
  yes: () => ({ text: '' }),
  no: (name, seed) => ({ text: pick([`No worries${name ? `, ${name}` : ''}! Anything else I can help with?`, 'Sure thing. Just ask if anything comes up.', 'Alright! I’m here if you need me.'], seed) }),
  catalog: () => ({ text: '' }),
  colors: () => ({ text: '' }),
  price: () => ({ text: '' }),
  new: () => ({ text: '' }),
  recommend: () => ({ text: '' }),
  compare: () => ({ text: '' }),
  style: () => ({ text: '' }),
  gift: () => ({ text: '' }),
  sizeHelp: () => ({
    text: `Happy to help! What's your weight in kg (height helps too)? Here's the quick guide for our oversized fit:\n${SIZE_BANDS}\nPrefer a more regular fit? Go one size down. Full measurements: [Size Guide](/size-guide).`,
    chips: ['I am 60 kg', 'I am 72 kg', 'I am 85 kg'],
  }),
  sizeChart: () => ({ text: sizeChartReply(), chips: ['Suggest my size', 'How does it fit?'] }),
  fit: () => ({
    text: `All ARVIIK tees have an **oversized, boxy fit**: dropped shoulders, roomy chest, a little longer in the body. Order your usual size for the oversized look, or one size down for a more regular fit. ${OFFERS.size.ask}`,
    chips: ['Suggest my size', 'Size chart'],
  }),
  shippingCost: () => ({
    text: `Shipping is **free** on orders of ${rupees(FREE_SHIPPING_THRESHOLD_RUPEES)} and above. Below that it's a flat ${rupees(FLAT_SHIPPING_FEE_RUPEES)}. Cash on Delivery adds a ${rupees(FLAT_COD_FEE_RUPEES)} COD fee. Details: [Shipping Policy](/shipping-policy).`,
    chips: CHIPS.afterShipping,
  }),
  deliveryTime: () => ({
    text: 'Orders are usually dispatched within **24–48 hours** and delivered in **3–5 business days** across India; remote pincodes can take a little longer. You can follow your order on [Track Order](/track-order).',
    chips: ['Shipping charges', 'Is COD available?', 'Track my order'],
  }),
  international: () => ({ text: "Right now we ship **only within India**. We'll share it here first if that changes." }),
  cod: () => ({
    text: `Yes, **Cash on Delivery** is available on serviceable pincodes. It carries a flat ${rupees(FLAT_COD_FEE_RUPEES)} COD fee, and checkout shows whether COD is available for your pincode. Paying online skips that fee.`,
    chips: ['Payment options', 'Shipping charges'],
  }),
  payment: () => ({
    text: 'You can pay online through **Razorpay** (UPI, cards, net banking and wallets), or choose **Cash on Delivery** where available. Payments are processed securely by Razorpay.',
    chips: ['Is COD available?', 'Shipping charges'],
  }),
  discount: () => ({
    text: `Any offer you're eligible for is shown at checkout before you pay, and shipping is free on orders of ${rupees(FREE_SHIPPING_THRESHOLD_RUPEES)} and above. I can't create or apply coupon codes myself.`,
    chips: ['Show the collection', 'Shipping charges'],
  }),
  refund: () => ({
    text: 'ARVIIK **doesn’t offer refunds** on delivered orders, but you can **exchange for a different size** within 7 days of delivery (unworn, unwashed, tags on). The one exception: a prepaid order cancelled within **2 hours** of confirmation is refunded in full. Details: [Exchange Policy](/refund-policy).',
    chips: ['How do exchanges work?', 'Cancel my order', 'Damaged item'],
  }),
  exchange: () => ({
    text: 'You can **exchange for a different size** of the same design within **7 days of delivery**. The tee must be unworn, unwashed, with tags and packaging intact. Pickup is free, and the new size arrives in 7–10 working days after a quick quality check. To start, email info@arviik.in or use the [Contact page](/contact) with your order number. We don’t offer refunds. [Exchange Policy](/refund-policy).',
    chips: ['Suggest my size', 'Damaged item', 'Talk to a human'],
  }),
  cancel: () => ({
    text: "You can cancel within **2 hours** of order confirmation by emailing info@arviik.in with your order number. Prepaid orders cancelled in that window are refunded in full. After 2 hours an order can't be cancelled, but you can exchange the size once it's delivered.",
    chips: ['How do exchanges work?', 'Talk to a human'],
  }),
  damaged: () => ({
    text: `Really sorry about that! Message us within **48 hours of delivery** with your order number and a photo, on ${WA} or at info@arviik.in. We'll send a **free replacement**, or if it's out of stock, an exchange for another product of equal value.`,
    chips: ['Talk to a human', 'Track my order'],
  }),
  track: () => ({
    text: `You can see the live status of every order on [Track Order](/track-order) after logging in. I can't see orders myself, so if something looks wrong, message the team on ${WA} with your order number.`,
    chips: ['Delivery time?', 'Talk to a human'],
  }),
  contact: () => ({ text: `You can reach the ARVIIK team on ${WA}, or email **info@arviik.in**. There's also the [Contact page](/contact). They usually reply within a few hours.` }),
  fabric: () => ({
    text: `Our tees are **240 GSM heavyweight combed cotton** (French terry), bio-washed and pre-shrunk. That means thick, not see-through, soft on the skin, and they hold their shape wash after wash. ${OFFERS.shop.ask}`,
    chips: ['Show the collection', 'How do I wash it?'],
  }),
  care: () => ({
    text: 'To keep it looking new: turn it **inside out**, wash **cold** on a gentle cycle with mild detergent and no bleach, **air dry** in the shade, and never iron directly on the print. It’s pre-shrunk, so it keeps its fit.',
    chips: ['What is the fabric like?', 'Show the collection'],
  }),
  restock: () => ({ text: `Popular sizes do come back, but I can't promise dates. Message the team on ${WA} and ask to be told when your size is back.` }),
  account: () => ({
    text: 'You need an account to place an order. [Log in or sign up here](/login). Forgot your password? Tap **Forgot password?** on the sign-in screen and we’ll email you a reset link. Once logged in, your orders show up on [Track Order](/track-order).',
  }),
  howToOrder: () => ({
    text: 'Pick a tee in the [Shop](/shop), choose your size, tap **Add to Bag**, then check out. You’ll log in, add your address, and pay online or choose Cash on Delivery. That’s it!',
    chips: ['Find my size', 'Payment options'],
  }),
};

function fallback(seed: string): Reply {
  return {
    text: pick(
      [
        `Hmm, I'm not sure about that one. I'm best with **sizing**, **products**, **shipping**, **exchanges** and **orders**. Could you put it another way? Or the team can help on ${WA}.`,
        `I didn't quite catch that. Try asking about sizes, our tees, delivery or exchanges. For anything else, the team is on ${WA} or at info@arviik.in.`,
      ],
      seed
    ),
    chips: CHIPS.fallback,
  };
}

/* ─────────────────────────── conversational replies ─────────────────────────── */

function sizeReply(weight: number, height: number | null, n: string, matched: ArisProduct[]): Reply {
  if (weight < 30 || weight > 200) return { text: "That weight doesn't look right. Could you double-check it in kg?" };
  const fit = wantsRegularFit(n) ? 'regular' : 'oversized';
  const rec = recommendSize(weight, fit);
  const idx = SIZE_ORDER.indexOf(rec);
  const alt = fit === 'oversized' && idx > 0 ? SIZE_ORDER[idx - 1] : null;
  let text = `At about **${Math.round(weight)} kg**${height ? ` and ${height} cm` : ''}, go with **${rec}** for ${fit === 'oversized' ? 'our signature oversized fit' : 'a more regular fit'}.`;
  if (alt) text += ` Want it less baggy? Try **${alt}**.`;
  if (height && height >= 183 && idx < SIZE_ORDER.length - 1) text += ` Since you're tall, **${SIZE_ORDER[idx + 1]}** gives a bit more length if you like it long.`;
  if (height && height <= 165 && idx > 0 && fit === 'oversized') text += ` On a shorter frame, **${SIZE_ORDER[idx - 1]}** keeps the length from swallowing you.`;
  const designs = new Set(matched.map((p) => p.name.toLowerCase()));
  if (matched.length && designs.size === 1) text += `\n${matched.map((p) => stockLine(p, rec)).join('\n')}`;
  else text += ' [Size Guide](/size-guide)';
  return { text, chips: [`Show tees in ${rec}`, 'Which one do you recommend?', 'How do exchanges work?'] };
}

function compareReply(groups: ArisProduct[][]): Reply {
  const lines = groups.slice(0, 3).map((g) => {
    const prices = [...new Set(g.map((p) => p.price))].map(rupees).join(' / ');
    const colours = g.map((p) => p.colorName).filter(Boolean);
    const sizes = [...new Set(g.flatMap((p) => p.sizesInStock))];
    return `- [${g[0].name}](${g[0].url}): ${prices}${colours.length ? `, ${colours.join(' & ')}` : ''}, ${sizes.length ? `sizes ${SIZE_ORDER.filter((s) => sizes.includes(s)).join(', ')}` : 'sold out'}`;
  });
  const cheapest = groups.map((g) => ({ g, p: Math.min(...g.map((x) => x.price)) })).sort((a, b) => a.p - b.p);
  const verdict =
    cheapest.length > 1 && cheapest[0].p < cheapest[1].p
      ? `**${cheapest[0].g[0].name}** is the better deal on price.`
      : 'Same price and same 240 GSM oversized build, so it really comes down to the design and colour you vibe with.';
  return { text: `Here's how they compare:\n${lines.join('\n')}\n${verdict} ${OFFERS.size.ask}`, chips: ['Suggest my size', 'How do I style it?'] };
}

function recommendReply(products: ArisProduct[], n: string, name: string | null, seed: string): Reply {
  let pool = products;
  const color = wantedColor(n);
  if (color) pool = products.filter((p) => productMatchesColor(p, color.key));
  else if (has(n, /\b(dark|darker)\b/)) pool = products.filter(isDark);
  else if (has(n, /\b(light|lighter|bright|summer)\b/)) pool = products.filter(isLight);
  if (!pool.length) pool = products;
  const picks = topPicks(pool, 2);
  if (!picks.length) return { text: `Everything's moving fast right now. Check the [Shop](/shop) for what's in stock, or ask the team on ${WA}.` };
  const [a, b] = picks;
  let text = `${pick(['If I had to pick', 'My pick', 'Going with my gut'], seed)}${name ? ` for you, ${name}` : ''}: ${label(a)}, ${priceText(a)}.${describe(a)} It's got the most sizes in stock (${a.sizesInStock.join(', ')}).`;
  if (b) text += `\nAlso a strong choice: ${label(b)}, ${priceText(b)}.`;
  text += `\n${OFFERS.size.ask}`;
  return { text, chips: ['Suggest my size', 'How do I style it?', 'Show the collection'] };
}

function giftReply(products: ArisProduct[]): Reply {
  const picks = topPicks(products, 2);
  const list = picks.map((p) => `- ${label(p)}: ${priceText(p)}`).join('\n');
  return {
    text: `Love that! A heavyweight oversized tee makes an easy gift.${picks.length ? ` Safe picks with the most sizes in stock:\n${list}` : ''}\nNot sure of their size? Tell me their weight and I'll suggest one. If it doesn't fit, they can exchange for another size within 7 days of delivery.`,
    chips: ['They are 70 kg', 'Show the collection', 'How do exchanges work?'],
  };
}

function styleReply(products: ArisProduct[], matched: ArisProduct[], n: string): Reply {
  const night = has(n, /\b(party|night|date|club|evening)\b/);
  const tips = [
    '- **Everyday**: straight or baggy jeans, or cargos, with chunky sneakers.',
    '- **Layered**: throw an open overshirt or denim jacket over it.',
    `- **${night ? 'Night out' : 'Evening'}**: go dark (black, navy, brown) with black denim and clean white sneakers.`,
    '- **Shorter frame?** A small front tuck sharpens the oversized shape.',
  ];
  const target = matched.length === 1 ? matched[0] : topPicks(night ? products.filter(isDark) : products, 1)[0];
  const tryLine = target ? `\nTry it with ${label(target)}, ${priceText(target)}.` : '';
  return { text: `Oversized tees are easy to style:\n${tips.join('\n')}${tryLine}`, chips: ['Suggest my size', 'Show the collection'] };
}

/* ─────────────────────────── main ─────────────────────────── */

type Ctx = { turns: ChatTurn[]; products: ArisProduct[]; name: string | null };

function respond(text: string, ctx: Ctx): Reply {
  const { turns, products, name } = ctx;
  const seed = `${text}|${turns.length}`;
  const n = correctTypos(normalize(text), products);
  const prevAssistant = [...turns].reverse().find((t, i) => i > 0 && t.role === 'assistant')?.content || '';
  const askedWeight = /your weight|their weight/i.test(prevAssistant);

  const scored = scoreIntents(n);
  const intents = scored.map(([i]) => i);
  const top = intents[0];

  // A "yes" to the offer Aris just made runs that offer.
  if (top === 'yes' || (top === 'ack' && Object.values(OFFERS).some((o) => prevAssistant.includes(o.ask)))) {
    const offer = Object.values(OFFERS).find((o) => prevAssistant.includes(o.ask));
    if (offer) return respond(offer.run, ctx);
    return { text: 'Great! What would you like to do next?', chips: CHIPS.start };
  }
  if (top === 'frustrated') return REPLIES.frustrated(name, seed);

  const sizes = wantedSizes(text, n);
  // "that size" / "my size" → the size Aris recommended earlier in the chat.
  if (!sizes.length && /\b(that|this|my|the same|same|recommended|suggested) size\b/.test(n)) {
    const rec = prevAssistant.match(/go with \*\*(XXL|XL|S|M|L)\*\*/);
    if (rec) sizes.push(rec[1]);
  }
  const color = wantedColor(n);
  const weight = weightKg(n, askedWeight);
  const height = heightCm(text);

  // Product mentioned now, or the one being discussed a turn or two ago.
  let matched = findProducts(n, products);
  const refersBack = /\b(it|this|that|this one|that one|available|them|these)\b/.test(n);
  const browsing = top === 'catalog' || top === 'new';
  if (!matched.length && (refersBack || ((sizes.length || weight) && !browsing))) {
    for (const t of [...turns].slice(0, -1).reverse().slice(0, 4)) {
      const prev = findProducts(normalize(t.content), products);
      if (prev.length && prev.length <= 3) {
        matched = prev;
        break;
      }
    }
  }
  if (matched.length > 1 && color) {
    const byColor = matched.filter((p) => productMatchesColor(p, color.key));
    if (byColor.length) matched = byColor;
  }
  const groups = [...groupByName(matched).values()];

  // 1) Size from weight (and height).
  if (weight) return sizeReply(weight, height, n, matched);
  if (height && (top === 'sizeHelp' || askedWeight || !top)) {
    return {
      text: `Got it, about **${height} cm**. Weight is the best guide for our oversized fit, so what's your weight in kg?`,
      chips: ['60 kg', '72 kg', '85 kg'],
    };
  }

  // 2) Style / compare / specific products.
  if (top === 'style') return styleReply(products, matched, n);
  if (groups.length >= 2 && (intents.includes('compare') || / or /.test(n))) return compareReply(groups);
  // Product answers when the question is about the product itself (price,
  // stock, sizes, colours). Policy questions ("delivery time for Polarize?")
  // get the policy answer instead.
  const PRODUCTY: Intent[] = ['catalog', 'price', 'new', 'restock', 'colors', 'compare', 'about'];
  if (matched.length && (!top || sizes.length || PRODUCTY.includes(top))) {
    const parts: string[] = [];
    for (const group of groups) {
      if (sizes.length) parts.push(group.map((p) => sizesLine(p, sizes)).join('\n'));
      else if (group.length > 1) parts.push(`**${group[0].name}** comes in ${group.length} colours:\n${group.map(productLine).join('\n')}`);
      else parts.push(`${productLine(group[0]).slice(2)}.${describe(group[0])}`);
    }
    if (color && !matched.some((p) => productMatchesColor(p, color.key))) parts.push(`It isn't available in ${color.word} right now.`);
    if (!sizes.length) parts.push(OFFERS.size.ask);
    return { text: parts.join('\n\n'), chips: sizes.length ? ['How do I style it?', 'Delivery time?'] : CHIPS.afterProduct };
  }

  // 3) Colour search across the catalog.
  if (color && (intents.length === 0 || intents.some((i) => ['catalog', 'price', 'new', 'restock', 'recommend'].includes(i)) || /\b(any|have|got|in|colou?r|show)\b/.test(n))) {
    if (top === 'recommend') return recommendReply(products, n, name, seed);
    const byColor = products.filter((p) => productMatchesColor(p, color.key));
    if (byColor.length) return { text: catalogReply(byColor, `Here's what we have in ${color.word}:`) + `\n${OFFERS.size.ask}`, chips: CHIPS.afterProduct };
    const colours = [...new Set(products.map((p) => p.colorName).filter(Boolean))];
    return { text: `We don't have anything in ${color.word} right now. Current colours: ${colours.join(', ') || 'see the shop'}. [Shop all](/shop)`, chips: ['Which one do you recommend?'] };
  }

  // 4) "Show me tees in M" → everything in stock in that size.
  if (sizes.length && (!top || ['catalog', 'new', 'restock', 'recommend', 'price'].includes(top))) {
    const fits = products.filter((p) => sizes.some((s) => p.sizesInStock.includes(s)));
    return fits.length
      ? { text: catalogReply(fits, `In stock in **${sizes.join(' / ')}**:`), chips: ['Which one do you recommend?', 'Delivery time?'] }
      : { text: `Nothing in ${sizes.join(' / ')} right now, sorry! Ask the team on ${WA} to be told when it's back.` };
  }

  // 5) Catalog-wide questions.
  const cap = n.match(/(under|below|less than|within|upto|up to|max)\s*(rs\.?|₹|inr)?\s*(\d{3,5})/);
  if (cap && (top === 'catalog' || top === 'price' || top === 'new' || top === 'recommend' || !top)) {
    const limit = parseInt(cap[3], 10);
    const fits = products.filter((p) => p.price <= limit);
    const lo = products.length ? Math.min(...products.map((p) => p.price)) : 0;
    return fits.length
      ? { text: catalogReply(fits, `Tees at ${rupees(limit)} or less:`), chips: CHIPS.afterCatalog }
      : { text: `Nothing at ${rupees(limit)} or less right now. Our tees start at ${rupees(lo)}. [Shop all](/shop)` };
  }
  if (top === 'recommend') return recommendReply(products, n, name, seed);
  if (top === 'gift') return giftReply(products);
  if (top === 'colors') {
    const byColour = new Map<string, ArisProduct[]>();
    for (const p of products) {
      if (!p.colorName) continue;
      const k = p.colorName.toLowerCase();
      byColour.set(k, [...(byColour.get(k) || []), p]);
    }
    if (!byColour.size) return { text: `See every colourway in the [Shop](/shop).` };
    const lines = [...byColour.values()].map((ps) => `- **${ps[0].colorName}**: ${ps.map((p) => `[${p.name}](${p.url})`).join(', ')}`);
    return { text: `Colours in the shop right now:\n${lines.join('\n')}\n${OFFERS.pick.ask}`, chips: CHIPS.afterCatalog };
  }
  if (top === 'catalog' || top === 'new') {
    return {
      text: catalogReply(products, top === 'new' ? 'Our latest drops:' : `Here's what's in the shop right now:`) + `\n${OFFERS.pick.ask}`,
      chips: CHIPS.afterCatalog,
    };
  }
  if (top === 'price' && !intents.slice(1, 2).some((i) => ['shippingCost', 'cod', 'deliveryTime'].includes(i))) {
    if (!products.length) return { text: catalogReply(products, '') };
    const prices = products.map((p) => p.price);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    return { text: catalogReply(products, lo === hi ? `All our tees are ${rupees(lo)} right now:` : `Our tees range from ${rupees(lo)} to ${rupees(hi)}:`), chips: CHIPS.afterCatalog };
  }

  // 6) Policy / help intents: answer the top one, plus a second only when it
  // was clearly asked too and its answer isn't already covered by the first.
  if (top) {
    const first = REPLIES[top](name, seed);
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
    };
    const skipSecond =
      !second ||
      ((secondScore ?? 0) < 2 && GENERIC.includes(second)) ||
      ['greet', 'thanks', 'bye', 'catalog', 'price', 'new', 'ack', 'yes', 'no', 'smalltalk', 'compliment'].includes(second) ||
      (COVERED[top] || []).includes(second) ||
      ['greet', 'thanks', 'smalltalk', 'compliment', 'ack', 'no', 'bye'].includes(top);
    if (!skipSecond) {
      const extra = REPLIES[second as Intent](name, seed);
      if (extra.text) return { text: `${first.text}\n\n${extra.text}`, chips: extra.chips || first.chips };
    }
    return first.text ? first : fallback(seed);
  }

  return fallback(seed);
}

const GREETING = /^\s*(hi+|hey+|hello+|helo|hlo|yo|namaste|hii+|good (morning|afternoon|evening))( there| aris| team)?[\s,!.]*/i;

// Several questions in one message → answer each ("what's the price? and do
// you ship to Mumbai?").
function splitQuestions(text: string): string[] {
  return text
    .split(/\?+\s*|\n+|\s+(?:and also|also|plus)\s+/i)
    .map((s) => s.trim())
    .filter((s) => words(normalize(s)).length >= 2);
}

export function arisAnswer(turns: ChatTurn[], products: ArisProduct[]): string {
  const last = turns[turns.length - 1]?.content || '';
  const name = customerName(turns, products);
  const ctx: Ctx = { turns, products, name };
  const seed = `${last}|${turns.length}`;

  // "Hi, I'm Rohan" / "my name is Rohan" with nothing else to answer.
  const introducedNow = name && customerName([{ role: 'user', content: last }], products) === name;
  let body = last.replace(GREETING, '').replace(/\b(?:my name is|my names|myself|call me)\s+[a-z]{2,15}\b[\s,.!]*/i, '').trim();
  if (introducedNow && /^(?:i am|i'm|im)\s+[a-z]{2,15}\s*[.!]?$/i.test(body)) body = '';
  const greeted = GREETING.test(last);

  if (introducedNow && words(normalize(body)).length === 0) {
    return format({
      text: `${pick(['Nice to meet you', 'Great to meet you', 'Hey'], seed)}, ${name}! I'm **Aris**. I can find your size, show you the latest tees, or answer anything about delivery and exchanges. What are you looking for?`,
      chips: CHIPS.start,
    });
  }
  if (greeted && words(normalize(body)).length === 0) return format(REPLIES.greet(name, seed));

  const parts = splitQuestions(body || last);
  let reply: Reply;
  if (parts.length > 1) {
    const answers: Reply[] = [];
    const seen = new Set<string>();
    for (const part of parts.slice(0, 3)) {
      const r = respond(part, ctx);
      if (r.text && !seen.has(r.text) && !r.text.startsWith("Hmm, I'm not sure") && !r.text.startsWith("I didn't quite")) {
        seen.add(r.text);
        answers.push(r);
      }
    }
    reply = answers.length
      ? { text: answers.map((a) => a.text).join('\n\n'), chips: answers[answers.length - 1].chips }
      : respond(body || last, ctx);
  } else {
    reply = respond(body || last, ctx);
  }

  if (greeted || introducedNow) {
    reply = { ...reply, text: `${pick(['Hey', 'Hi'], seed)}${name ? ` ${name}` : ''}! ${reply.text}` };
  }
  return format(reply);
}

function format(r: Reply): string {
  const chips = (r.chips || []).slice(0, 3);
  return chips.length ? `${r.text}${CHIPS_MARKER} ${chips.join(' | ')}` : r.text;
}
