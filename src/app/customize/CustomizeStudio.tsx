'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, X, Check, ImagePlus, RefreshCw, RotateCcw, Shapes, ShoppingBag, Trash2, Type, Crosshair, Ruler,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import {
  AREAS, AREA_LABEL, AREA_VIEW, FONT_KEYS, FONT_LABEL, GRAPHICS, NECK_LABEL, TEE_IMAGES, UNIT, VB,
  emptyDesign, graphicDataUrl, hasExtraPrint, isDark, layerSrc, lightOpacity, neckInk, newId, renderPreview, shadeOpacity, stageBackground, textBox, isPhotoColour,
  type Area, type Design, type FontKey, type Layer, type View,
} from '@/lib/customizer';
import { STUDIO_FONTS } from './fonts';

export type StudioColor = { name: string; hex: string };
export type StudioProduct = { id: string; name: string; slug: string; price: number; discountPrice?: number };

const STEPS = [
  { key: 'color', label: 'Colour' },
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'sleeves', label: 'Sleeves' },
  { key: 'size', label: 'Size' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
type Size = (typeof SIZES)[number];

const INK_COLORS = ['#ffffff', '#111111', '#d4af37', '#e11d48', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f9a8d4'];

const DRAFT_KEY = 'arviik_custom_draft';
const MAX_UPLOAD = 10 * 1024 * 1024;
const priceOf = (p: StudioProduct | null) => (p ? (p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price) : 0);

/** Downscales an upload for the editor (the original is what gets printed). */
function fileToEditorImage(file: File): Promise<{ src: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1400;
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({ src: c.toDataURL('image/webp', 0.9), aspect: img.naturalHeight / img.naturalWidth });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That image could not be read.'));
    };
    img.src = url;
  });
}

export default function CustomizeStudio({
  colors,
  base,
  plus,
}: {
  colors: StudioColor[];
  base: StudioProduct | null;
  plus: StudioProduct | null;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const first = colors[0] || { name: 'Jet Black', hex: '#141414' };

  const [design, setDesign] = useState<Design>(() => emptyDesign(first.name, first.hex));
  const [step, setStep] = useState<StepKey>('color');
  // Front or back on show. Customers flip with the buttons or a sideways
  // swipe; the two sides cross-fade.
  const [view, setView] = useState<View>('front');
  const turnTo = (v: View) => setView(v);
  const [sleeve, setSleeve] = useState<'leftSleeve' | 'rightSleeve'>('leftSleeve');
  const [selected, setSelected] = useState<{ area: Area; id: string } | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const originals = useRef(new Map<string, File>());
  const fileInput = useRef<HTMLInputElement>(null);

  // Re-measure text once the print fonts have loaded.
  const [, setFontsTick] = useState(0);
  useEffect(() => {
    let off = false;
    Promise.all(
      FONT_KEYS.map((k) => document.fonts?.load(`${STUDIO_FONTS[k].weight} 40px ${STUDIO_FONTS[k].family}`).catch(() => null))
    ).then(() => {
      if (!off) setFontsTick((t) => t + 1);
    });
    return () => {
      off = true;
    };
  }, []);

  // The builder covers the whole screen; stop the page behind it scrolling.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  // ---- draft (restores a design after logging in / reloading) ----
  const restored = useRef(false);
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw) as { design: Design; size: Size | null };
          if (d?.design?.areas) {
            // keep the colour only if it's still offered
            const still = colors.find((c) => c.hex === d.design.colorHex);
            setDesign(still ? d.design : { ...d.design, colorName: first.name, colorHex: first.hex });
            if (d.size) setSize(d.size);
          }
        }
      } catch {
        /* no draft */
      }
      restored.current = true;
    });
  }, [colors, first.name, first.hex]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ design, size }));
    } catch {
      // Too big with images: keep the draft without uploaded images.
      try {
        const lite: Design = {
          ...design,
          areas: Object.fromEntries(
            Object.entries(design.areas).map(([a, ls]) => [a, ls.filter((l) => l.kind !== 'image')])
          ) as Design['areas'],
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ design: lite, size }));
      } catch {
        /* storage unavailable */
      }
    }
  }, [design, size]);

  // ---- derived ----
  const extra = hasExtraPrint(design);
  const product = extra ? plus : base;
  const price = priceOf(product);
  const basePrice = priceOf(base);
  const extraPrice = Math.max(0, priceOf(plus) - basePrice);
  const totalLayers = Object.values(design.areas).reduce((n, ls) => n + ls.length, 0);
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const activeArea: Area | null = step === 'front' ? 'front' : step === 'back' ? 'back' : step === 'sleeves' ? sleeve : null;
  const ink = isDark(design.colorHex) ? '#ffffff' : '#111111';

  const goStep = (k: StepKey) => {
    setStep(k);
    setSelected(null);
    if (k === 'back') turnTo('back');
    else if (k === 'front' || k === 'sleeves') turnTo('front');
  };

  // ---- layer editing ----
  const patchLayer = useCallback((area: Area, id: string, patch: Partial<Layer>) => {
    setDesign((d) => ({
      ...d,
      areas: { ...d.areas, [area]: d.areas[area].map((l) => (l.id === id ? { ...l, ...patch } : l)) },
    }));
  }, []);

  const addLayer = (area: Area, layer: Omit<Layer, 'id' | 'x' | 'y' | 'rotation'> & Partial<Layer>) => {
    const id = newId();
    // stack new prints down the area instead of on top of each other
    const big = area === 'front' || area === 'back';
    const count = design.areas[area].length;
    const y = big ? Math.min(0.85, 0.3 + 0.22 * count) : 0.5;
    const l: Layer = { x: 0.5, y, rotation: 0, ...layer, id };
    setDesign((d) => ({ ...d, areas: { ...d.areas, [area]: [...d.areas[area], l] } }));
    setSelected({ area, id });
    setAdded(false);
    return id;
  };

  const removeLayer = (area: Area, id: string) => {
    originals.current.delete(id);
    setDesign((d) => ({ ...d, areas: { ...d.areas, [area]: d.areas[area].filter((l) => l.id !== id) } }));
    setSelected(null);
  };

  const isSleeve = activeArea === 'leftSleeve' || activeArea === 'rightSleeve';

  const onAddText = () => {
    if (!activeArea) return;
    addLayer(activeArea, { kind: 'text', text: isSleeve ? 'ARVIIK' : 'YOUR TEXT', font: 'block', color: ink, w: isSleeve ? 0.55 : 0.5 });
  };

  const onAddGraphic = (gid: string) => {
    if (!activeArea) return;
    const g = GRAPHICS.find((x) => x.id === gid)!;
    addLayer(activeArea, { kind: 'graphic', graphic: gid, color: ink, w: isSleeve ? 0.4 : 0.42, aspect: g.aspect });
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeArea) return;
    setError(null);
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError('Upload a PNG, JPG or WEBP image.');
      return;
    }
    if (file.size > MAX_UPLOAD) {
      setError('That image is over 10 MB. Please upload a smaller file.');
      return;
    }
    try {
      const { src, aspect } = await fileToEditorImage(file);
      const id = addLayer(activeArea, { kind: 'image', src, aspect, w: isSleeve ? 0.6 : 0.7 });
      originals.current.set(id, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That image could not be read.');
    }
  };

  const selectedLayer = selected ? design.areas[selected.area].find((l) => l.id === selected.id) || null : null;

  // ---- drag on the preview: a print moves it, anywhere else spins the tee ----
  const faceRefs = useRef<Record<View, SVGSVGElement | null>>({ front: null, back: null });
  const drag = useRef<{ area: Area; id: string; sx: number; sy: number; x: number; y: number; k: number } | null>(null);
  const swipe = useRef<{ x: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const onLayerDown = (e: React.PointerEvent, area: Area, l: Layer) => {
    e.stopPropagation();
    if (activeArea !== area) {
      // jump to that area's step so its controls show
      goStep(area === 'front' ? 'front' : area === 'back' ? 'back' : 'sleeves');
      if (area === 'leftSleeve' || area === 'rightSleeve') setSleeve(area);
    }
    setSelected({ area, id: l.id });
    const svg = faceRefs.current[AREA_VIEW[area]];
    const k = svg ? VB.w / svg.getBoundingClientRect().width : 1;
    drag.current = { area, id: l.id, sx: e.clientX, sy: e.clientY, x: l.x, y: l.y, k };
    stageRef.current?.setPointerCapture(e.pointerId);
  };

  const onStageDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX };
    stageRef.current?.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const r = AREAS[d.area];
      const a = (-r.rot * Math.PI) / 180;
      const dx = (e.clientX - d.sx) * d.k, dy = (e.clientY - d.sy) * d.k;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);
      const clamp = (v: number) => Math.min(1, Math.max(0, v));
      patchLayer(d.area, d.id, { x: clamp(d.x + lx / r.w), y: clamp(d.y + ly / r.h) });
      return;
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (stageRef.current?.hasPointerCapture(e.pointerId)) stageRef.current.releasePointerCapture(e.pointerId);
    drag.current = null;
    const sw = swipe.current;
    swipe.current = null;
    if (!sw) return;
    if (Math.abs(e.clientX - sw.x) > 40) {
      setView((v) => (v === 'front' ? 'back' : 'front'));
    }
    setSelected(null);
  };

  // ---- add to bag ----
  const onAddToBag = async () => {
    setError(null);
    if (!totalLayers) {
      setError('Add at least one print: text, a graphic or your own image.');
      goStep('front');
      return;
    }
    if (!size) {
      setError('Pick your size.');
      goStep('size');
      return;
    }
    if (!product) {
      setError('Customize is being set up. Please try again shortly.');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.push('/login?next=/customize');
      return;
    }

    try {
      setBusy('Saving your design…');
      if (document.fonts) {
        await Promise.all(
          FONT_KEYS.map((k) => document.fonts.load(`${STUDIO_FONTS[k].weight} 40px ${STUDIO_FONTS[k].family}`).catch(() => null))
        );
      }
      const designId = crypto.randomUUID();
      const folder = `${user.id}/${designId}`;
      const bucket = supabase.storage.from('custom-designs');
      const upload = async (path: string, body: Blob, type: string) => {
        const { error: upErr } = await bucket.upload(path, body, { contentType: type, upsert: false });
        if (upErr) throw upErr;
        return bucket.getPublicUrl(path).data.publicUrl;
      };

      // Previews from the editor copy (data URLs draw without CORS issues).
      const [frontImg, backImg] = await Promise.all([
        renderPreview(design, 'front', STUDIO_FONTS),
        renderPreview(design, 'back', STUDIO_FONTS),
      ]);
      const previewType = frontImg.startsWith('data:image/webp') ? 'image/webp' : 'image/png';
      const previewExt = previewType === 'image/webp' ? 'webp' : 'png';
      const toBlob = async (u: string) => (await fetch(u)).blob();

      setBusy('Uploading artwork…');
      const areas = {} as Design['areas'];
      for (const area of Object.keys(design.areas) as Area[]) {
        areas[area] = [];
        for (const l of design.areas[area]) {
          if (l.kind === 'image' && l.src?.startsWith('data:')) {
            const original = originals.current.get(l.id);
            const blob = original || (await toBlob(l.src));
            const type = original?.type || blob.type || 'image/webp';
            const ext = type.includes('png') ? 'png' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : 'webp';
            const url = await upload(`${folder}/${l.id}.${ext}`, blob, type);
            areas[area].push({ ...l, src: url });
          } else {
            areas[area].push(l);
          }
        }
      }
      const [previewFront, previewBack] = await Promise.all([
        upload(`${folder}/preview-front.${previewExt}`, await toBlob(frontImg), previewType),
        upload(`${folder}/preview-back.${previewExt}`, await toBlob(backImg), previewType),
      ]);

      const { error: insErr } = await supabase.from('custom_designs').insert({
        id: designId,
        product_id: product.id,
        size,
        color_name: design.colorName,
        color_hex: design.colorHex,
        design: { ...design, areas },
        preview_front: previewFront,
        preview_back: previewBack,
      });
      if (insErr) throw insErr;

      addToCart({
        productId: product.id,
        name: `Custom Tee · ${design.colorName}${extra ? ' · Front + Back' : ''}`,
        price: product.price,
        discountPrice: product.discountPrice,
        image: previewFront,
        slug: product.slug,
        size,
        quantity: 1,
        maxStock: 10,
        customDesignId: designId,
      });
      setAdded(true);
      window.dispatchEvent(new CustomEvent('open-cart'));
    } catch (err) {
      console.error('Custom tee add to bag failed:', err);
      setError('Could not save your design. Please check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const resetDesign = () => {
    originals.current.clear();
    setDesign(emptyDesign(design.colorName, design.colorHex));
    setSelected(null);
    setAdded(false);
  };

  // ---- render helpers ----
  const areasOf = (v: View) => (Object.keys(AREAS) as Area[]).filter((a) => AREA_VIEW[a] === v);

  const renderLayer = (area: Area, l: Layer) => {
    const r = AREAS[area];
    const w = l.w * r.w;
    const tx = (l.x - 0.5) * r.w;
    const ty = (l.y - 0.5) * r.h;
    const common = {
      transform: `translate(${tx} ${ty}) rotate(${l.rotation})`,
      onPointerDown: (e: React.PointerEvent) => onLayerDown(e, area, l),
      style: { cursor: 'grab', touchAction: 'none' as const },
    };
    if (l.kind === 'text') {
      const f = STUDIO_FONTS[(l.font as FontKey) || 'bold'];
      return (
        <g key={l.id} {...common}>
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={textBox(l, r, STUDIO_FONTS).size}
            fill={l.color}
            style={{ fontFamily: f.family, fontWeight: f.weight, userSelect: 'none' }}
          >
            {l.text}
          </text>
        </g>
      );
    }
    const h = w * (l.aspect || 1);
    return (
      <g key={l.id} {...common}>
        <image href={layerSrc(l)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
      </g>
    );
  };

  const selectionBox = (area: Area, l: Layer) => {
    const r = AREAS[area];
    const w = l.w * r.w;
    const tb = l.kind === 'text' ? textBox(l, r, STUDIO_FONTS) : null;
    const fs = tb?.size || 0;
    const bw = tb ? Math.max(fs, tb.width) : w;
    const bh = l.kind === 'text' ? fs * 1.2 : w * (l.aspect || 1);
    return (
      <rect
        x={-bw / 2 - 3 * UNIT}
        y={-bh / 2 - 3 * UNIT}
        width={bw + 6 * UNIT}
        height={bh + 6 * UNIT}
        transform={`translate(${(l.x - 0.5) * r.w} ${(l.y - 0.5) * r.h}) rotate(${l.rotation})`}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1.2 * UNIT}
        strokeDasharray={`${4 * UNIT} ${3 * UNIT}`}
        pointerEvents="none"
      />
    );
  };

  // One side of the tee: the photo recoloured, the prints, then the photo's
  // folds and highlights over them so prints sit in the fabric.
  const neckColor = neckInk(design.colorHex);
  const photoMode = isPhotoColour(design.colorHex);
  // light tees sit on a dark backdrop, dark tees on a light one
  const darkStage = !isDark(design.colorHex);
  const renderFace = (v: View) => {
    const img = TEE_IMAGES[v];
    const markW = (NECK_LABEL.markH * 145) / 147;
    return (
      <svg
        ref={(el) => {
          faceRefs.current[v] = el;
        }}
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="absolute inset-0 w-full h-full select-none"
        style={{
          opacity: view === v ? 1 : 0,
          transform: view === v ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 380ms ease, transform 380ms ease',
          pointerEvents: view === v ? 'auto' : 'none',
        }}
        role="img"
        aria-label={`${design.colorName} tee, ${v}`}
      >
        <defs>
          <mask id={`cz-shape-${v}`} style={{ maskType: 'alpha' }}>
            <image href={img.shade} width={VB.w} height={VB.h} />
          </mask>
          {v === 'front' && (
            <mask id="cz-neck" style={{ maskType: 'alpha' }}>
              <image
                href={NECK_LABEL.mask}
                x={NECK_LABEL.cx - markW / 2}
                y={NECK_LABEL.markY - NECK_LABEL.markH / 2}
                width={markW}
                height={NECK_LABEL.markH}
              />
            </mask>
          )}
          {areasOf(v).map((a) => (
            <clipPath key={a} id={`cz-clip-${a}`}>
              <rect x={-AREAS[a].w / 2} y={-AREAS[a].h / 2} width={AREAS[a].w} height={AREAS[a].h} />
            </clipPath>
          ))}
        </defs>
        <g style={{ isolation: 'isolate' }}>
          {photoMode ? (
            <image href={img.photo} width={VB.w} height={VB.h} />
          ) : (
            <rect width={VB.w} height={VB.h} fill={design.colorHex} mask={`url(#cz-shape-${v})`} style={{ transition: 'fill 300ms' }} />
          )}
          {v === 'front' && (
            <g pointerEvents="none">
              <rect
                x={NECK_LABEL.cx - markW / 2}
                y={NECK_LABEL.markY - NECK_LABEL.markH / 2}
                width={markW}
                height={NECK_LABEL.markH}
                fill={neckColor}
                mask="url(#cz-neck)"
              />
              <text
                x={NECK_LABEL.cx}
                y={NECK_LABEL.textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={NECK_LABEL.textSize}
                letterSpacing={NECK_LABEL.textSize * 0.35}
                fill={neckColor}
                style={{ fontFamily: STUDIO_FONTS.bold.family, fontWeight: STUDIO_FONTS.bold.weight }}
              >
                {NECK_LABEL.text}
              </text>
            </g>
          )}
          {areasOf(v).map((a) => {
            const r = AREAS[a];
            return (
              <g key={a} transform={`translate(${r.cx} ${r.cy}) rotate(${r.rot})`}>
                <g clipPath={`url(#cz-clip-${a})`}>{design.areas[a].map((l) => renderLayer(a, l))}</g>
              </g>
            );
          })}
          <image
            href={img.shade}
            width={VB.w}
            height={VB.h}
            pointerEvents="none"
            opacity={photoMode ? 0.55 : shadeOpacity(design.colorHex)}
            style={{ mixBlendMode: 'multiply' }}
          />
          {!photoMode && (
            <image href={img.light} width={VB.w} height={VB.h} pointerEvents="none" opacity={lightOpacity(design.colorHex)} style={{ mixBlendMode: 'screen' }} />
          )}
        </g>
        {areasOf(v).map((a) => {
          const r = AREAS[a];
          return (
            <g key={a} transform={`translate(${r.cx} ${r.cy}) rotate(${r.rot})`} pointerEvents="none">
              {activeArea === a && (
                <rect
                  x={-r.w / 2}
                  y={-r.h / 2}
                  width={r.w}
                  height={r.h}
                  fill="none"
                  stroke={isDark(design.colorHex) ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)'}
                  strokeWidth={UNIT}
                  strokeDasharray={`${5 * UNIT} ${4 * UNIT}`}
                />
              )}
              {selected?.area === a && selectedLayer && selectionBox(a, selectedLayer)}
            </g>
          );
        })}
      </svg>
    );
  };

  // ---- UI ----
  const swatch = (on: boolean) =>
    `rounded-full border transition-all ${on ? 'ring-2 ring-offset-2 ring-stone-950 border-transparent' : 'border-stone-300 hover:scale-105'}`;
  const toolBtn =
    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 bg-white text-[10px] font-extrabold uppercase tracking-widest hover:border-stone-950 transition-colors flex-shrink-0';
  const stepDone = (k: StepKey) =>
    k === 'color' ||
    (k === 'front' && design.areas.front.length > 0) ||
    (k === 'back' && design.areas.back.length > 0) ||
    (k === 'sleeves' && design.areas.leftSleeve.length + design.areas.rightSleeve.length > 0) ||
    (k === 'size' && !!size);

  const close = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <div
      className={`fixed inset-0 z-[45] flex flex-col transition-colors duration-500 ${darkStage ? 'text-white' : 'text-stone-950'}`}
      style={{ background: stageBackground(design.colorHex) }}
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-8 h-14 sm:h-16">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="font-syne font-extrabold text-sm sm:text-base tracking-[0.28em]">
            ARVIIK
          </Link>
          <span className={`hidden sm:block h-5 w-px ${darkStage ? 'bg-white/25' : 'bg-stone-300'}`} />
          <div className="hidden sm:block leading-tight min-w-0">
            <p className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.3em] ${darkStage ? 'text-white/50' : 'text-stone-500'}`}>By You</p>
            <p className="text-[11px] sm:text-xs font-semibold truncate">Oversized Tee · {design.colorName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="hidden sm:block font-syne font-extrabold text-base">{price ? formatPrice(price) : ''}</span>
          <button
            onClick={onAddToBag}
            disabled={!!busy}
            className={`inline-flex items-center gap-1.5 rounded-full ${darkStage ? 'bg-white text-stone-950 hover:bg-stone-200' : 'bg-stone-950 text-white hover:bg-stone-800'} px-4 sm:px-6 py-2.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] disabled:opacity-70`}
          >
            {busy ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving
              </>
            ) : added ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" /> Add to bag
              </>
            )}
          </button>
          <button
            onClick={close}
            aria-label="Close"
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-950 grid place-items-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Product stage */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={stageRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onStageDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="relative h-[94%] max-w-[94%] aspect-[1400/1557]">
            {renderFace('front')}
            {renderFace('back')}
          </div>
          <div className={`pointer-events-none absolute left-1/2 bottom-[2%] -translate-x-1/2 w-[40%] max-w-[380px] h-4 rounded-[50%] blur-md ${darkStage ? 'bg-black/40' : 'bg-black/15'}`} />
        </div>

        {/* views */}
        <div className="absolute left-3 sm:left-8 top-2 sm:top-4 flex sm:flex-col gap-1.5">
          {(['front', 'back'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => {
                turnTo(v);
                setSelected(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-colors ${
                view === v
                  ? darkStage
                    ? 'bg-white text-stone-950'
                    : 'bg-stone-950 text-white'
                  : darkStage
                    ? 'bg-white/10 text-white/70 hover:text-white'
                    : 'bg-white/80 text-stone-600 hover:text-stone-950'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          Swipe to see the other side
        </p>
      </div>

      {/* Option panel */}
      <div className="flex-shrink-0 bg-white text-stone-950 rounded-t-[28px] shadow-[0_-12px_40px_-24px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between px-3 sm:px-8 pt-3">
          <button
            onClick={() => stepIndex > 0 && goStep(STEPS[stepIndex - 1].key)}
            disabled={stepIndex === 0}
            aria-label="Previous step"
            className="w-10 h-10 rounded-full border border-stone-200 grid place-items-center hover:border-stone-950 disabled:opacity-30 disabled:hover:border-stone-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.2em]">{STEPS[stepIndex].label}</p>
            <p className="text-[10px] font-bold text-stone-400">
              {stepIndex + 1} / {STEPS.length}
              {(step === 'back' || step === 'sleeves') && extraPrice > 0 ? ` · +${formatPrice(extraPrice)}` : ''}
            </p>
          </div>
          <button
            onClick={() => stepIndex < STEPS.length - 1 && goStep(STEPS[stepIndex + 1].key)}
            disabled={stepIndex === STEPS.length - 1}
            aria-label="Next step"
            className="w-10 h-10 rounded-full border border-stone-200 grid place-items-center hover:border-stone-950 disabled:opacity-30 disabled:hover:border-stone-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* step track */}
        <div className="flex justify-center gap-1.5 pt-2 pb-3">
          {STEPS.map((s) => (
            <button
              key={s.key}
              onClick={() => goStep(s.key)}
              aria-label={s.label}
              title={s.label}
              className={`h-1.5 rounded-full transition-all ${
                step === s.key ? 'w-8 bg-stone-950' : stepDone(s.key) ? 'w-4 bg-stone-400' : 'w-4 bg-stone-200'
              }`}
            />
          ))}
        </div>

        <div className="max-h-[36vh] sm:max-h-[30vh] overflow-y-auto px-4 sm:px-8 pb-5">
          <div className="max-w-3xl mx-auto space-y-3">
            {step === 'color' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap justify-center gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.hex + c.name}
                      onClick={() => setDesign((d) => ({ ...d, colorName: c.name, colorHex: c.hex }))}
                      className={`w-10 h-10 sm:w-12 sm:h-12 ${swatch(c.hex === design.colorHex)}`}
                      style={{ background: c.hex }}
                      aria-label={c.name}
                      title={c.name}
                    />
                  ))}
                </div>
                <p className="text-center text-[11px] text-stone-500">
                  Selected: <span className="font-bold text-stone-900">{design.colorName}</span>
                </p>
              </div>
            )}

            {activeArea && (
              <div className="space-y-3">
                {step === 'sleeves' && (
                  <div className="grid grid-cols-2 gap-1 bg-stone-100 rounded-full p-1 max-w-xs mx-auto">
                    {(['leftSleeve', 'rightSleeve'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSleeve(s);
                          setSelected(null);
                        }}
                        className={`py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                          sleeve === s ? 'bg-white shadow-sm text-stone-950' : 'text-stone-500'
                        }`}
                      >
                        {AREA_LABEL[s]}
                      </button>
                    ))}
                  </div>
                )}

                {/* tools + this area's prints */}
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] justify-start sm:justify-center -mx-1 px-1">
                  <button onClick={() => fileInput.current?.click()} className={toolBtn}>
                    <ImagePlus className="w-3.5 h-3.5" /> Upload
                  </button>
                  <button onClick={onAddText} className={toolBtn}>
                    <Type className="w-3.5 h-3.5" /> Text
                  </button>
                  <button onClick={() => setSelected(null)} className={toolBtn}>
                    <Shapes className="w-3.5 h-3.5" /> Graphics
                  </button>
                  {design.areas[activeArea].map((l) => {
                    const on = selected?.id === l.id;
                    const label =
                      l.kind === 'text'
                        ? `“${(l.text || '').slice(0, 12)}”`
                        : l.kind === 'graphic'
                          ? GRAPHICS.find((g) => g.id === l.graphic)?.label || 'Graphic'
                          : 'Your image';
                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelected({ area: activeArea, id: l.id })}
                        className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          on ? 'bg-stone-950 text-white border-stone-950' : 'border-stone-200 text-stone-700 bg-stone-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onUpload} />

                {selectedLayer && selected?.area === activeArea ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 rounded-2xl bg-stone-50 border border-stone-200 p-3.5 min-w-0">
                    <div className="space-y-3 min-w-0">
                      {selectedLayer.kind === 'text' && (
                        <>
                          <input
                            value={selectedLayer.text || ''}
                            maxLength={isSleeve ? 12 : 28}
                            onChange={(e) => patchLayer(activeArea, selectedLayer.id, { text: e.target.value })}
                            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold bg-white"
                            placeholder="Type your text"
                            aria-label="Text"
                          />
                          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                            {FONT_KEYS.map((k) => (
                              <button
                                key={k}
                                onClick={() => patchLayer(activeArea, selectedLayer.id, { font: k })}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-sm ${
                                  selectedLayer.font === k ? 'border-stone-950 bg-white' : 'border-stone-200 bg-white/60 text-stone-600'
                                }`}
                                style={{ fontFamily: STUDIO_FONTS[k].family, fontWeight: STUDIO_FONTS[k].weight }}
                              >
                                {FONT_LABEL[k]}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {selectedLayer.kind !== 'image' && (
                        <div className="flex flex-wrap items-center gap-2">
                          {INK_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => patchLayer(activeArea, selectedLayer.id, { color: c })}
                              className={`w-7 h-7 ${swatch(selectedLayer.color === c)}`}
                              style={{ background: c }}
                              aria-label={`Colour ${c}`}
                            />
                          ))}
                          <label
                            className="w-7 h-7 rounded-full border border-dashed border-stone-400 relative overflow-hidden cursor-pointer bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]"
                            title="Any colour"
                          >
                            <input
                              type="color"
                              value={selectedLayer.color || '#111111'}
                              onChange={(e) => patchLayer(activeArea, selectedLayer.id, { color: e.target.value })}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              aria-label="Pick any colour"
                            />
                          </label>
                        </div>
                      )}
                      {selectedLayer.kind === 'image' && (
                        <p className="text-[11px] text-stone-500">Your image. Drag it on the tee to place it.</p>
                      )}
                    </div>
                    <div className="space-y-2.5 min-w-0">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Size</span>
                        <input
                          type="range"
                          min={0.12}
                          max={selectedLayer.kind === 'text' ? 1.4 : 1}
                          step={0.01}
                          value={selectedLayer.w}
                          onChange={(e) => patchLayer(activeArea, selectedLayer.id, { w: Number(e.target.value) })}
                          className="w-full accent-stone-950"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                          Rotate · {Math.round(selectedLayer.rotation)}°
                        </span>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          step={1}
                          value={selectedLayer.rotation}
                          onChange={(e) => patchLayer(activeArea, selectedLayer.id, { rotation: Number(e.target.value) })}
                          className="w-full accent-stone-950"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            patchLayer(activeArea, selectedLayer.id, {
                              x: 0.5,
                              y: activeArea === 'front' || activeArea === 'back' ? 0.35 : 0.5,
                              rotation: 0,
                            })
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-stone-200 bg-white text-[10px] font-extrabold uppercase tracking-widest"
                        >
                          <Crosshair className="w-3.5 h-3.5" /> Centre
                        </button>
                        <button
                          onClick={() => removeLayer(activeArea, selectedLayer.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-[10px] font-extrabold uppercase tracking-widest"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] justify-start sm:justify-center -mx-1 px-1 pb-1">
                    {GRAPHICS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => onAddGraphic(g.id)}
                        className="flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl border border-stone-200 hover:border-stone-950 flex items-center justify-center p-3 transition-colors"
                        style={{ background: design.colorHex }}
                        title={g.label}
                        aria-label={`Add ${g.label}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={graphicDataUrl(g.id, ink)} alt="" className="max-w-full max-h-full" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 'size' && (
              <div className="space-y-2.5">
                <div className="flex justify-center gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`w-12 sm:w-14 py-3 rounded-xl border text-xs font-extrabold ${
                        size === s ? 'bg-stone-950 text-white border-stone-950' : 'border-stone-200 hover:border-stone-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500">
                  <span>Oversized fit · made to order</span>
                  <Link href="/size-guide" target="_blank" className="inline-flex items-center gap-1 font-bold text-stone-700 hover:text-stone-950">
                    <Ruler className="w-3.5 h-3.5" /> Size guide
                  </Link>
                  <button onClick={resetDesign} className="inline-flex items-center gap-1 font-bold text-stone-700 hover:text-stone-950">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-center text-xs font-semibold text-red-600">{error}</p>}
            {busy && <p className="text-center text-[11px] text-stone-500">{busy}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
