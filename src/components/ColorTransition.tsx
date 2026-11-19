'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Branded page transitions for the home "Filter By Color" row. Mounted once
// in the root layout so it survives the route change; chips trigger it with
// startColorTransition().
//
// • Single color: the screen floods with the tapped color, the ARVIIK
//   wordmark rises in letter by letter with the color name, then fades.
// • "View All" (`stripes`): SPECTRUM — an editorial brand reveal. Near-black
//   stage, the catalog colors drifting behind as soft light, film grain, the
//   wordmark resolving from blur with a single sheen, a hairline "color
//   card" of every colorway, then a clean upward wipe into the shop.

const EVENT = 'arviik:color-transition';
const LETTERS = 'ARVIIK'.split('');
const MAX_VISIBLE_MS = 3200; // never trap the customer if navigation stalls

const SOLID = { minVisible: 900, leave: 450 };
const SPECTRUM = { minVisible: 1450, leave: 700 };

type ColorDetail = { name: string; hex: string; target: string; stripes?: string[] };

// Full-screen text needs a lower threshold than swatch borders: mid-tone
// colors like sand/cream already make white text hard to read.
function needsDarkText(hex: string): boolean {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const [r, g, b] = m.slice(1).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

export function startColorTransition(detail: ColorDetail) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  window.dispatchEvent(new CustomEvent<ColorDetail>(EVENT, { detail }));
}

export default function ColorTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState<ColorDetail | null>(null);
  const [leaving, setLeaving] = useState(false);
  const startedAt = useRef(0);
  const activeRef = useRef<ColorDetail | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isSpectrum = (d: ColorDetail | null) => !!d?.stripes && d.stripes.length > 1;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const close = () => {
    clearTimers();
    setLeaving(true);
    const leaveMs = isSpectrum(activeRef.current) ? SPECTRUM.leave : SOLID.leave;
    timers.current.push(
      setTimeout(() => {
        activeRef.current = null;
        setActive(null);
        setLeaving(false);
      }, leaveMs)
    );
  };

  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent<ColorDetail>).detail;
      clearTimers();
      startedAt.current = performance.now();
      activeRef.current = detail;
      setLeaving(false);
      setActive(detail);
      timers.current.push(setTimeout(close, MAX_VISIBLE_MS));
    };
    window.addEventListener(EVENT, onStart);
    return () => {
      window.removeEventListener(EVENT, onStart);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the destination page is on screen, finish the animation (but not
  // before it has had time to play out).
  useEffect(() => {
    if (!active || leaving || pathname !== active.target) return;
    const minVisible = isSpectrum(active) ? SPECTRUM.minVisible : SOLID.minVisible;
    const remaining = Math.max(0, minVisible - (performance.now() - startedAt.current));
    const t = setTimeout(close, remaining);
    timers.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, active, leaving]);

  if (!active) return null;

  if (isSpectrum(active)) {
    return <SpectrumScene colors={active.stripes!} leaving={leaving} />;
  }

  const fg = needsDarkText(active.hex) ? '#1c1917' : '#ffffff';

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center select-none ${
        leaving ? 'arviik-ct-leave pointer-events-none' : 'arviik-ct-enter'
      }`}
      style={{ backgroundColor: active.hex, color: fg }}
    >
      {/* soft vignette so flat colors still feel premium */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.28)_100%)] pointer-events-none" />

      <div className="relative flex flex-col items-center px-4 text-center">
        <div className="flex font-syne font-extrabold text-4xl sm:text-6xl uppercase overflow-hidden pb-1">
          {LETTERS.map((ch, i) => (
            <span
              key={i}
              className="arviik-ct-letter inline-block mx-[0.18em]"
              style={{ animationDelay: `${80 + i * 55}ms` }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div
          className="arviik-ct-line h-[2px] w-full mt-3"
          style={{ background: `linear-gradient(90deg, transparent, ${fg}, transparent)` }}
        />
        <span className="arviik-ct-name mt-4 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.45em] opacity-80">
          {active.name}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────────── SPECTRUM ───────────────────────────── */

// Where each color's glow sits on the stage (cycled if there are more colors).
const ORB_POSITIONS = [
  { left: '-18%', top: '-12%' },
  { left: '52%', top: '-18%' },
  { left: '48%', top: '58%' },
  { left: '-22%', top: '52%' },
  { left: '18%', top: '22%' },
];

// Static film grain (SVG noise), inlined so it costs no request.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function SpectrumScene({ colors, leaving }: { colors: string[]; leaving: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] select-none overflow-hidden bg-[#0a0a0a] text-white ${
        leaving ? 'arviik-sp-wipe pointer-events-none' : 'arviik-ct-enter'
      }`}
    >
      {/* Colorways as slow, soft light behind the stage */}
      <div className="absolute inset-0">
        {colors.map((hex, i) => {
          const pos = ORB_POSITIONS[i % ORB_POSITIONS.length];
          return (
            <div
              key={`${hex}-${i}`}
              className="arviik-sp-orb absolute w-[95vmax] h-[95vmax] rounded-full"
              style={{
                ...pos,
                background: `radial-gradient(circle at center, ${hex} 0%, ${hex}cc 22%, ${hex}00 64%)`,
                animationDelay: `${i * 90}ms, ${i * 90}ms`,
              }}
            />
          );
        })}
      </div>

      {/* Darken the centre so type always reads, and the edges for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,10,0.78)_0%,rgba(10,10,10,0.45)_32%,rgba(10,10,10,0.05)_70%,rgba(10,10,10,0.5)_100%)]" />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.09] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />

      {/* Editorial frame: hairline corners */}
      <div className="arviik-sp-frame absolute inset-5 sm:inset-8 pointer-events-none">
        <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-white/25" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-white/25" />
        <span className="absolute left-0 bottom-0 h-5 w-5 border-l border-b border-white/25" />
        <span className="absolute right-0 bottom-0 h-5 w-5 border-r border-b border-white/25" />
      </div>

      <div className={`relative h-full w-full flex flex-col items-center justify-center px-6 text-center ${leaving ? 'arviik-sp-content-out' : ''}`}>
        <span className="arviik-sp-fade text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.6em] text-white/55 pl-[0.6em]" style={{ animationDelay: '120ms' }}>
          The Full Collection
        </span>

        {/* Wordmark: each letter resolves from blur; then one sheen passes */}
        <div className="relative mt-5 sm:mt-6">
          <div className="flex font-syne font-extrabold text-[44px] sm:text-7xl uppercase leading-none">
            {LETTERS.map((ch, i) => (
              <span
                key={i}
                className="arviik-sp-letter inline-block mx-[0.14em]"
                style={{ animationDelay: `${220 + i * 70}ms` }}
              >
                {ch}
              </span>
            ))}
          </div>
          <div className="arviik-sp-sheen absolute inset-0 flex font-syne font-extrabold text-[44px] sm:text-7xl uppercase leading-none pointer-events-none" aria-hidden="true">
            {LETTERS.map((ch, i) => (
              <span key={i} className="inline-block mx-[0.14em]">{ch}</span>
            ))}
          </div>
        </div>

        {/* Hairline color card: one segment per colorway */}
        <div className="arviik-sp-line mt-6 sm:mt-7 flex h-[2px] w-[min(68vw,320px)] overflow-hidden rounded-full">
          {colors.map((hex, i) => (
            <span key={`${hex}-${i}`} className="flex-1 h-full" style={{ backgroundColor: hex }} />
          ))}
        </div>

        <div className="arviik-sp-fade mt-5 flex items-center gap-3 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.45em] text-white/60" style={{ animationDelay: '950ms' }}>
          <span>{colors.length} Colorways</span>
          <span className="h-[3px] w-[3px] rounded-full bg-white/40" />
          <span>Wear Your Identity</span>
        </div>
      </div>
    </div>
  );
}
