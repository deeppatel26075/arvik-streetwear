// Shared model + drawing for the "Customize" tee designer. The same
// geometry is used by the live SVG editor and by the canvas export that
// produces the preview PNGs (cart thumbnail, emails, admin).

export type View = 'front' | 'back';
export type Area = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

export type Layer = {
  id: string;
  kind: 'image' | 'text' | 'graphic';
  /** image: data URL while editing, public URL once uploaded */
  src?: string;
  /** graphic id from GRAPHICS */
  graphic?: string;
  text?: string;
  font?: string; // key of FONT_KEYS
  color?: string;
  /** centre, as a fraction of the print area (0..1) */
  x: number;
  y: number;
  /** width as a fraction of the print area width */
  w: number;
  rotation: number;
  /** natural aspect (height / width) for images and graphics */
  aspect?: number;
};

export type Design = {
  colorName: string;
  colorHex: string;
  areas: Record<Area, Layer[]>;
};

export const AREA_LABEL: Record<Area, string> = {
  front: 'Front',
  back: 'Back',
  leftSleeve: 'Left Sleeve',
  rightSleeve: 'Right Sleeve',
};

/** Which view each print area is shown on. */
export const AREA_VIEW: Record<Area, View> = {
  front: 'front',
  back: 'back',
  leftSleeve: 'front',
  rightSleeve: 'front',
};

// ---- Geometry ------------------------------------------------------------
// One unit = one pixel of the tee photos in public/customizer (made by
// tools/customizer/make-tee-assets.mjs from the front+back mockup photo).

export const VB = { w: 1400, h: 1557 };

export type Rect = { cx: number; cy: number; w: number; h: number; rot: number };

/** Print areas. "Left sleeve" is the wearer's left, so on the front view it
 *  sits on the viewer's right. */
export const AREAS: Record<Area, Rect> = {
  front: { cx: 700, cy: 620, w: 560, h: 700, rot: 0 },
  back: { cx: 700, cy: 600, w: 600, h: 760, rot: 0 },
  rightSleeve: { cx: 170, cy: 560, w: 170, h: 110, rot: 36 },
  leftSleeve: { cx: 1230, cy: 560, w: 170, h: 110, rot: -36 },
};

/** The photo layers for each side: shade (multiplied over the tee colour,
 *  its alpha is the tee's shape) and light (screened highlights). */
export const TEE_IMAGES: Record<View, { shade: string; light: string; photo: string }> = {
  front: { shade: '/customizer/tee-front-shade.png', light: '/customizer/tee-front-light.png', photo: '/customizer/tee-front-photo.png' },
  back: { shade: '/customizer/tee-back-shade.png', light: '/customizer/tee-back-light.png', photo: '/customizer/tee-back-photo.png' },
};

/** The mockup photo is a black tee: for black (or near-black) tees the real
 *  photo is shown untouched, which looks more natural than recolouring. */
export function isPhotoColour(hex: string): boolean {
  return luminance(hex) < 45;
}

/** ARVIIK logo printed inside the back neck (seen through the collar on the
 *  front view). */
export const NECK_LABEL = {
  mask: '/customizer/arviik-mark-mask.png',
  cx: 705,
  markY: 74,
  markH: 46,
  textY: 118,
  textSize: 17,
  text: 'ARVIIK',
};

/** How strongly the photo's shading shows: softer on light tees so they
 *  don't look grey. */
export function shadeOpacity(hex: string): number {
  const l = luminance(hex);
  return l > 200 ? 0.85 : l > 150 ? 0.92 : 1;
}

/** Highlights: gentler on very dark tees, where they'd look patchy. */
export function lightOpacity(hex: string): number {
  return luminance(hex) < 60 ? 0.35 : 0.3;
}

/** Studio backdrop behind the tee: dark for light tees so they stand out,
 *  light for dark tees. */
export const stageBackground = (teeHex: string) => (isDark(teeHex) ? '#ecebe8' : '#2a2926');

/** Neck-print ink: light on dark tees, dark on light ones. */
export const neckInk = (hex: string) => (isDark(hex) ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,20,0.8)');

/** Stroke widths etc. were designed at 500 units wide. */
export const UNIT = VB.w / 500;

// ---- Fonts --------------------------------------------------------------

export const FONT_KEYS = ['bold', 'block', 'street', 'serif', 'mono', 'script'] as const;
export type FontKey = (typeof FONT_KEYS)[number];
export const FONT_LABEL: Record<FontKey, string> = {
  bold: 'Bold',
  block: 'Block',
  street: 'Street',
  serif: 'Classic',
  mono: 'Mono',
  script: 'Script',
};

// ---- Graphics -------------------------------------------------------------
// Each graphic is an SVG drawn in a single colour so it can match any tee.

type Graphic = { id: string; label: string; aspect: number; svg: (c: string) => string };

const svgWrap = (vb: string, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;

export const GRAPHICS: Graphic[] = [
  {
    id: 'bolt',
    label: 'Bolt',
    aspect: 1.5,
    svg: (c) => svgWrap('0 0 100 150', `<path fill="${c}" d="M62 0 L8 86 H46 L34 150 L92 58 H54 Z"/>`),
  },
  {
    id: 'flame',
    label: 'Flame',
    aspect: 1.3,
    svg: (c) =>
      svgWrap(
        '0 0 100 130',
        `<path fill="${c}" d="M52 0 C58 30 92 46 92 86 C92 112 72 130 50 130 C26 130 8 112 8 88 C8 64 24 52 30 34 C38 50 40 60 48 64 C52 44 46 22 52 0 Z M50 122 C64 122 72 110 72 98 C72 82 60 76 56 62 C50 78 36 84 36 100 C36 112 42 122 50 122 Z"/>`
      ),
  },
  {
    id: 'star',
    label: 'Star',
    aspect: 1,
    svg: (c) =>
      svgWrap('0 0 100 100', `<path fill="${c}" d="M50 0 L61 36 L100 38 L69 60 L80 100 L50 76 L20 100 L31 60 L0 38 L39 36 Z"/>`),
  },
  {
    id: 'eye',
    label: 'Eye',
    aspect: 0.6,
    svg: (c) =>
      svgWrap(
        '0 0 160 96',
        `<path fill="none" stroke="${c}" stroke-width="8" d="M6 48 Q80 -16 154 48 Q80 112 6 48 Z"/><circle cx="80" cy="48" r="22" fill="${c}"/><circle cx="88" cy="40" r="7" fill="none" stroke="${c}" stroke-width="0"/>`
      ),
  },
  {
    id: 'sparkle',
    label: 'Sparkle',
    aspect: 1,
    svg: (c) =>
      svgWrap(
        '0 0 100 100',
        `<path fill="${c}" d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0 Z"/>`
      ),
  },
  {
    id: 'barcode',
    label: 'Barcode',
    aspect: 0.5,
    svg: (c) => {
      const bars = [6, 3, 9, 3, 3, 6, 12, 3, 6, 3, 9, 6, 3, 3, 9, 3, 6, 12, 3, 6, 3, 9, 3, 6];
      let x = 0;
      const rects = bars
        .map((w, i) => {
          const r = i % 2 === 0 ? `<rect x="${x}" y="0" width="${w}" height="80" fill="${c}"/>` : '';
          x += w;
          return r;
        })
        .join('');
      return svgWrap(`0 0 ${x} ${x / 2}`, rects);
    },
  },
  {
    id: 'heart',
    label: 'Heart',
    aspect: 0.9,
    svg: (c) =>
      svgWrap('0 0 100 90', `<path fill="${c}" d="M50 90 L8 48 C-10 28 4 0 28 0 C40 0 46 8 50 14 C54 8 60 0 72 0 C96 0 110 28 92 48 Z"/>`),
  },
  {
    id: 'ring',
    label: 'Ring',
    aspect: 1,
    svg: (c) =>
      svgWrap(
        '0 0 100 100',
        `<circle cx="50" cy="50" r="44" fill="none" stroke="${c}" stroke-width="6"/><circle cx="50" cy="50" r="32" fill="none" stroke="${c}" stroke-width="2"/><path fill="${c}" d="M50 30 L56 46 L72 50 L56 54 L50 70 L44 54 L28 50 L44 46 Z"/>`
      ),
  },
];

export function graphicDataUrl(id: string, color: string): string {
  const g = GRAPHICS.find((x) => x.id === id) || GRAPHICS[0];
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(g.svg(color))}`;
}

// ---- Helpers ----------------------------------------------------------------

export const emptyDesign = (colorName: string, colorHex: string): Design => ({
  colorName,
  colorHex,
  areas: { front: [], back: [], leftSleeve: [], rightSleeve: [] },
});

/** Anything printed beyond the front makes it the "Front + Back" tee. */
export function hasExtraPrint(d: Design): boolean {
  return d.areas.back.length + d.areas.leftSleeve.length + d.areas.rightSleeve.length > 0;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 140;
}

export const newId = () => Math.random().toString(36).slice(2, 10);

/** For text layers, `w` sets the font size: size = w * area width * this. */
export const TEXT_SIZE_RATIO = 0.32;

type FontMap = Record<FontKey, { family: string; weight: number }>;
let measureCtx: CanvasRenderingContext2D | null = null;

/** Font size and width for a text layer. Text that would run past its
 *  print area is shrunk to fit, the same way in the editor and the export. */
export function textBox(l: Layer, r: Rect, fonts: FontMap): { size: number; width: number } {
  const f = fonts[(l.font as FontKey) || 'bold'];
  let size = l.w * r.w * TEXT_SIZE_RATIO;
  const max = r.w * 0.96;
  if (typeof document === 'undefined') return { size, width: (l.text || '').length * size * 0.6 };
  measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
  if (!measureCtx) return { size, width: (l.text || '').length * size * 0.6 };
  measureCtx.font = `${f.weight} ${size}px ${f.family}`;
  const width = measureCtx.measureText(l.text || '').width;
  if (width > max) {
    size *= max / width;
    return { size, width: max };
  }
  return { size, width };
}

// ---- Canvas export ----------------------------------------------------------

// Images are reused across redraws (the 3D tee redraws on every edit).
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imageCache.get(src);
  if (hit) return hit;
  const p = loadImageOnce(src);
  if (imageCache.size > 60) imageCache.clear();
  imageCache.set(src, p);
  p.catch(() => imageCache.delete(src));
  return p;
}

function loadImageOnce(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function layerSrc(l: Layer): string | undefined {
  if (l.kind === 'graphic') return graphicDataUrl(l.graphic || 'bolt', l.color || '#111');
  return l.src;
}

/** Draws one side of the design (tee photo, recoloured, with its prints)
 *  to an image data URL (WEBP where the browser supports it, else PNG).
 *  `fonts` maps font keys to CSS font families loaded on the page. */
export async function renderPreview(
  d: Design,
  view: View,
  fonts: Record<FontKey, { family: string; weight: number }>,
  scale = 1
): Promise<string> {
  const tee = await renderTeeCanvas(d, view, fonts, scale);
  const W = tee.width, H = tee.height;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = stageBackground(d.colorHex);
  ctx.fillRect(0, 0, W, H);
  ctx.shadowColor = 'rgba(0,0,0,0.16)';
  ctx.shadowBlur = 30 * scale;
  ctx.shadowOffsetY = 14 * scale;
  ctx.drawImage(tee, 0, 0);
  return canvas.toDataURL('image/webp', 0.92);
}

/** One side of the tee with its prints, on a transparent canvas. Used for
 *  the saved previews and as the 3D tee's texture. */
export async function renderTeeCanvas(
  d: Design,
  view: View,
  fonts: Record<FontKey, { family: string; weight: number }>,
  scale = 1
): Promise<HTMLCanvasElement> {
  const W = Math.round(VB.w * scale), H = Math.round(VB.h * scale);
  const photoMode = isPhotoColour(d.colorHex);
  const [shade, light, photo] = await Promise.all([
    loadImage(TEE_IMAGES[view].shade),
    loadImage(TEE_IMAGES[view].light),
    photoMode ? loadImage(TEE_IMAGES[view].photo) : Promise.resolve(null),
  ]);

  // The tee on its own layer: colour cut to the tee's shape, then prints,
  // then the photo's folds and highlights over both.
  const tee = document.createElement('canvas');
  tee.width = W;
  tee.height = H;
  const t = tee.getContext('2d')!;
  t.scale(scale, scale);
  if (photo) {
    t.drawImage(photo, 0, 0, VB.w, VB.h);
  } else {
    t.fillStyle = d.colorHex;
    t.fillRect(0, 0, VB.w, VB.h);
    t.globalCompositeOperation = 'destination-in';
    t.drawImage(shade, 0, 0, VB.w, VB.h);
    t.globalCompositeOperation = 'source-over';
  }

  if (view === 'front') await drawNeckLabel(t, d.colorHex, fonts);

  const areas = (Object.keys(AREAS) as Area[]).filter((a) => AREA_VIEW[a] === view);
  for (const area of areas) {
    const r = AREAS[area];
    for (const l of d.areas[area]) {
      t.save();
      t.translate(r.cx, r.cy);
      t.rotate((r.rot * Math.PI) / 180);
      // prints stay inside their print area
      t.beginPath();
      t.rect(-r.w / 2, -r.h / 2, r.w, r.h);
      t.clip();
      t.translate((l.x - 0.5) * r.w, (l.y - 0.5) * r.h);
      t.rotate((l.rotation * Math.PI) / 180);
      const w = l.w * r.w;
      if (l.kind === 'text') {
        const { size } = textBox(l, r, fonts);
        const f = fonts[(l.font as FontKey) || 'bold'];
        t.font = `${f.weight} ${size}px ${f.family}`;
        t.fillStyle = l.color || '#111';
        t.textAlign = 'center';
        t.textBaseline = 'middle';
        t.fillText(l.text || '', 0, 0);
      } else {
        const src = layerSrc(l);
        if (src) {
          try {
            const img = await loadImage(src);
            const h = w * (l.aspect || img.naturalHeight / img.naturalWidth || 1);
            t.drawImage(img, -w / 2, -h / 2, w, h);
          } catch {
            /* skip a broken image */
          }
        }
      }
      t.restore();
    }
  }

  // folds over the prints (the photo already has its own, so lighter there)
  t.globalAlpha = photo ? 0.55 : shadeOpacity(d.colorHex);
  t.globalCompositeOperation = 'multiply';
  t.drawImage(shade, 0, 0, VB.w, VB.h);
  if (!photo) {
    t.globalAlpha = lightOpacity(d.colorHex);
    t.globalCompositeOperation = 'screen';
    t.drawImage(light, 0, 0, VB.w, VB.h);
  }
  // multiply/screen can paint outside the tee; trim back to its shape
  t.globalAlpha = 1;
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(shade, 0, 0, VB.w, VB.h);
  return tee;
}

async function drawNeckLabel(t: CanvasRenderingContext2D, teeHex: string, fonts: Record<FontKey, { family: string; weight: number }>) {
  const ink = neckInk(teeHex);
  try {
    const mark = await loadImage(NECK_LABEL.mask);
    const h = NECK_LABEL.markH;
    const w = (h * mark.naturalWidth) / mark.naturalHeight;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * 4);
    c.height = Math.ceil(h * 4);
    const m = c.getContext('2d')!;
    m.drawImage(mark, 0, 0, c.width, c.height);
    m.globalCompositeOperation = 'source-in';
    m.fillStyle = ink;
    m.fillRect(0, 0, c.width, c.height);
    t.drawImage(c, NECK_LABEL.cx - w / 2, NECK_LABEL.markY - h / 2, w, h);
  } catch {
    /* label image missing */
  }
  t.save();
  t.fillStyle = ink;
  t.font = `${fonts.bold.weight} ${NECK_LABEL.textSize}px ${fonts.bold.family}`;
  t.textAlign = 'center';
  t.textBaseline = 'middle';
  const ls = t as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in ls) ls.letterSpacing = `${NECK_LABEL.textSize * 0.35}px`;
  t.fillText(NECK_LABEL.text, NECK_LABEL.cx, NECK_LABEL.textY);
  t.restore();
}
