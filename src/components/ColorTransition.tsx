'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Branded page transition for the home "Filter By Color" chips: the screen
// floods with the tapped color, the ARVIIK wordmark rises in letter by
// letter with the color name under it, then it fades away to reveal the
// filtered shop. Mounted once in the root layout so it survives the route
// change; the chips trigger it with startColorTransition().

const EVENT = 'arviik:color-transition';
const LETTERS = 'ARVIIK'.split('');
const MIN_VISIBLE_MS = 900; // long enough for the letters to finish
const MAX_VISIBLE_MS = 3000; // never trap the customer if navigation stalls
const FADE_MS = 450;

type ColorDetail = { name: string; hex: string; target: string };

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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const close = () => {
    clearTimers();
    setLeaving(true);
    timers.current.push(
      setTimeout(() => {
        setActive(null);
        setLeaving(false);
      }, FADE_MS)
    );
  };

  useEffect(() => {
    const onStart = (e: Event) => {
      const detail = (e as CustomEvent<ColorDetail>).detail;
      clearTimers();
      startedAt.current = performance.now();
      setLeaving(false);
      setActive(detail);
      timers.current.push(setTimeout(close, MAX_VISIBLE_MS));
    };
    window.addEventListener(EVENT, onStart);
    return () => {
      window.removeEventListener(EVENT, onStart);
      clearTimers();
    };
  }, []);

  // Once the destination page is on screen, finish the animation (but not
  // before the letters have had time to play).
  useEffect(() => {
    if (!active || leaving || pathname !== active.target) return;
    const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt.current));
    const t = setTimeout(close, remaining);
    timers.current.push(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, active, leaving]);

  if (!active) return null;

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
