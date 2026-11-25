// Builds the Customize tee images from one front+back mockup photo.
//
//   node tools/customizer/make-tee-assets.mjs [photo.jpg]
//
// The photo has the front tee on the left half and the back tee on the
// right half, on a plain light background (default: tools/customizer/tee-mockup.jpg).
// For each side it writes, into public/customizer/:
//   tee-<side>-shade.png  grey = how much light the fabric gets (folds,
//                         seams), alpha = the tee's shape. Multiplied over
//                         the chosen tee colour.
//   tee-<side>-light.png  the brighter-than-average parts (highlights),
//                         screened on top so dark tees still show folds.
// and prints the crop boxes used by src/lib/customizer.ts (TEE_PHOTO).
// Use a bigger photo (e.g. 4000 px wide) for sharper results; nothing else
// needs to change.

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const src = process.argv[2] || 'tools/customizer/tee-mockup.jpg';
const outDir = 'public/customizer';
const OUT_W = 1400; // output width of each tee image

fs.mkdirSync(outDir, { recursive: true });

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) lum[i] = 0.299 * data[i * C] + 0.587 * data[i * C + 1] + 0.114 * data[i * C + 2];

// background brightness from the corners
const bg = (lum[0] + lum[W - 1] + lum[(H - 1) * W] + lum[H * W - 1]) / 4;
const isTee = (l) => l < bg - 40;

// split into the two tees by empty columns
const colHas = [];
for (let x = 0; x < W; x++) {
  let n = 0;
  for (let y = 0; y < H; y++) if (isTee(lum[y * W + x])) n++;
  colHas.push(n > 2);
}
const segs = [];
let s = -1;
colHas.forEach((has, x) => {
  if (has && s < 0) s = x;
  if (!has && s >= 0) { segs.push([s, x - 1]); s = -1; }
});
if (s >= 0) segs.push([s, W - 1]);
const sides = segs.filter(([a, b]) => b - a > W * 0.2).slice(0, 2);
if (sides.length !== 2) throw new Error(`Expected 2 tees side by side, found ${sides.length}`);

const boxes = {};
for (const [name, [x0, x1]] of [['front', sides[0]], ['back', sides[1]]]) {
  let y0 = H, y1 = 0;
  const vals = [];
  for (let y = 0; y < H; y++)
    for (let x = x0; x <= x1; x++) {
      const l = lum[y * W + x];
      if (isTee(l)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); vals.push(l); }
    }
  vals.sort((a, b) => a - b);
  const tee = vals[Math.floor(vals.length * 0.5)]; // typical fabric brightness
  const pad = 2;
  const bx = Math.max(0, x0 - pad), by = Math.max(0, y0 - pad);
  const bw = Math.min(W - 1, x1 + pad) - bx + 1, bh = Math.min(H - 1, y1 + pad) - by + 1;

  // The outline comes from a lightly smoothed copy (crisp edges); the folds
  // and highlights from softer copies, so the photo's JPEG blocks don't show
  // once its dark tones are stretched. Blur scales with the upscale factor.
  const up = OUT_W / bw;
  const grey = (sigma, denoise = false) => {
    let pipe = sharp(src).removeAlpha().extract({ left: bx, top: by, width: bw, height: bh });
    // a small median filter removes JPEG block noise but keeps seams and ribbing
    if (denoise) pipe = pipe.median(5);
    return pipe.resize({ width: OUT_W, kernel: 'lanczos3' }).blur(Math.max(0.3, sigma)).greyscale().raw().toBuffer({ resolveWithObject: true });
  };
  const crop = await grey(0.35 * up);
  const soft = await grey(1.2 * up, true);
  const softer = await grey(3.5 * up);
  const cw = crop.info.width, ch = crop.info.height;
  // The photo itself (in colour, gently sharpened), shown as-is when the
  // customer picks the photo's own colour.
  const rgb = await sharp(src).removeAlpha().extract({ left: bx, top: by, width: bw, height: bh })
    .resize({ width: OUT_W, kernel: 'lanczos3' }).sharpen({ sigma: 0.8 }).raw().toBuffer({ resolveWithObject: true });
  const photo = Buffer.alloc(cw * ch * 4);
  // typical fabric colour, used to clean the background out of edge pixels
  let fr = 0, fg = 0, fb = 0, fn = 0;
  for (let i = 0; i < cw * ch; i++) {
    if (Math.abs(crop.data[i] - tee) < 6) { fr += rgb.data[i * 3]; fg += rgb.data[i * 3 + 1]; fb += rgb.data[i * 3 + 2]; fn++; }
  }
  const fabricRGB = [fr / fn, fg / fn, fb / fn];
  // Distance (in output pixels) from the tee's outline. The softened copies
  // pick up background within a few blur-widths of the edge, so values there
  // aren't trusted: they're filled from the nearest trusted fabric instead.
  const N = cw * ch;
  const dist = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const lin = (bg - 12 - crop.data[k]) / (bg - 12 - tee * 1.4);
    dist[k] = lin > 0.5 ? 1e9 : 0;
  }
  const dAt = (x, y) => (x < 0 || y < 0 || x >= cw || y >= ch ? 0 : dist[y * cw + x]);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const k = y * cw + x; if (!dist[k]) continue;
    dist[k] = Math.min(dist[k], dAt(x - 1, y) + 1, dAt(x, y - 1) + 1, dAt(x - 1, y - 1) + 1.414, dAt(x + 1, y - 1) + 1.414);
  }
  for (let y = ch - 1; y >= 0; y--) for (let x = cw - 1; x >= 0; x--) {
    const k = y * cw + x; if (!dist[k]) continue;
    dist[k] = Math.min(dist[k], dAt(x + 1, y) + 1, dAt(x, y + 1) + 1, dAt(x + 1, y + 1) + 1.414, dAt(x - 1, y + 1) + 1.414);
  }
  const SAFE = Math.ceil(2.5 * up); // roughly where the soft copy stops seeing background
  const SAFE_HI = Math.ceil(12 * up);
  // typical fabric shading, to calm the photo's bright edge lighting (on a
  // black tee it looks natural; recoloured light it reads as a halo)
  const trusted = [];
  for (let k = 0; k < N; k += 7) if (dist[k] > SAFE) trusted.push(soft.data[k] / tee);
  trusted.sort((x, y) => x - y);
  const relMed = trusted[Math.floor(trusted.length / 2)];
  const shade = Buffer.alloc(cw * ch * 4);
  const light = Buffer.alloc(cw * ch * 4);
  for (let i = 0; i < cw * ch; i++) {
    const l = crop.data[i];
    // alpha: 1 on fabric, 0 on background, soft at the edge
    const lin = Math.min(1, Math.max(0, (bg - 12 - l) / (bg - 12 - tee * 1.4)));
    // tighten the upscaled edge so it doesn't read as a grey outline
    const e = Math.min(1, Math.max(0, (lin - 0.42) / 0.16));
    const a = e * e * (3 - 2 * e);
    // near the outline the soft copy mixes in background, so there the
    // fabric's typical shade is used, blending into the real folds further in
    const sstep = (a0, a1, v) => {
      const x = Math.min(1, Math.max(0, (v - a0) / (a1 - a0)));
      return x * x * (3 - 2 * x);
    };
    const raw = soft.data[i] / tee; // 1 = average fabric
    // calm the photo's bright edge lighting, easing back to the real folds
    const calmed = Math.min(raw, relMed) + (raw - Math.min(raw, relMed)) * sstep(SAFE, 5 * SAFE, dist[i]);
    // right at the edge the soft copy sees background: blend to the typical shade
    const rel = relMed + (calmed - relMed) * sstep(0.4 * SAFE, 1.6 * SAFE, dist[i]);
    // soft shadow just inside the outline, so light tees keep a natural edge
    const edgeShade = 0.9 + 0.1 * Math.min(1, dist[i] / (3 * SAFE));
    // highlights only well inside the fabric, fading in from the edge
    const hiWeight = Math.min(1, Math.max(0, (dist[i] - SAFE_HI) / SAFE_HI));
    const relHi = 1 + (softer.data[i] / tee - 1) * hiWeight;
    // gentle: the photo only has ~34 brightness steps in the fabric, so
    // stretching it hard shows banding
    const sh = Math.max(0.5, Math.pow(Math.min(1, rel), 0.38));
    // edges blend into the background, so only count highlights on solid fabric
    const hi = Math.min(1, Math.max(0, (relHi - 1) * 0.9));
    const g = Math.round(Math.max(0.08, sh * edgeShade) * 255);
    shade[i * 4] = shade[i * 4 + 1] = shade[i * 4 + 2] = g;
    shade[i * 4 + 3] = Math.round(a * 255);
    const h = Math.round(hi * 255);
    light[i * 4] = light[i * 4 + 1] = light[i * 4 + 2] = h;
    light[i * 4 + 3] = Math.round(a * 255);
    // photo: real pixels on solid fabric; near the edge, pull towards the
    // fabric colour so no light background ring shows
    const solid = Math.pow(lin, 3);
    for (let c = 0; c < 3; c++) {
      const v = rgb.data[i * 3 + c];
      photo[i * 4 + c] = Math.round(Math.min(v, v * solid + fabricRGB[c] * (1 - solid)));
    }
    photo[i * 4 + 3] = Math.round(a * 255);
  }
  await sharp(photo, { raw: { width: cw, height: ch, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `tee-${name}-photo.png`));
  await sharp(shade, { raw: { width: cw, height: ch, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `tee-${name}-shade.png`));
  await sharp(light, { raw: { width: cw, height: ch, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(outDir, `tee-${name}-light.png`));
  boxes[name] = { x: bx, y: by, w: bw, h: bh, outW: cw, outH: ch };
}

// The ARVIIK mark (black on white) as a recolourable alpha mask for the
// collar print.
{
  const m = await sharp('public/arviik-mark.png').flatten({ background: '#ffffff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(m.info.width * m.info.height * 4);
  for (let i = 0; i < m.info.width * m.info.height; i++) {
    px[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, (235 - m.data[i]) / 200)) * 255);
  }
  await sharp(px, { raw: { width: m.info.width, height: m.info.height, channels: 4 } }).trim().png().toFile(path.join(outDir, 'arviik-mark-mask.png'));
}

console.log(JSON.stringify({ source: { w: W, h: H }, boxes }, null, 2));
