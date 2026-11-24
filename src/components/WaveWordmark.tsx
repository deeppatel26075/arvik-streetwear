'use client';

import React, { useEffect, useRef, useState } from 'react';

// ARVIIK wordmark for the mobile menu header — "founders' mark".
// A, R and K are the founders' initials. Tapping the wordmark fades V-I-I
// back so it reads as the A·R·K monogram; each initial lifts in turn with a
// lime underline, holds, then everything settles back to ARVIIK.
// Re-tapping restarts it (the key change remounts so the CSS replays).

const LETTERS = 'ARVIIK'.split('');

// letter index → position in the A·R·K sequence
const FOUNDERS: Record<number, { order: number }> = { 0: { order: 0 }, 1: { order: 1 }, 5: { order: 2 } };
const STEP_MS = 170;

// After a tap the A·R·K lift plays briefly, then `onNavigate` runs (the menu
// uses it to close and take the customer home).
const NAVIGATE_AFTER_MS = 700;

export default function WaveWordmark({ className = '', onNavigate }: { className?: string; onNavigate?: () => void }) {
  const [run, setRun] = useState(0);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (navTimer.current) clearTimeout(navTimer.current);
  }, []);

  const play = () => {
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (onNavigate) {
      if (navTimer.current) clearTimeout(navTimer.current);
      navTimer.current = setTimeout(onNavigate, reduced ? 0 : NAVIGATE_AFTER_MS);
    }
    if (reduced) return;
    setRun((n) => n + 1);
    try {
      navigator.vibrate?.([8, STEP_MS - 8, 8, STEP_MS - 8, 8]); // one tick per initial
    } catch {
      // vibration unsupported (iOS / desktop) — purely a nicety
    }
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={onNavigate ? 'ARVIIK home' : 'ARVIIK'}
      className={`relative inline-flex select-none py-1 text-left [-webkit-tap-highlight-color:transparent] ${className}`}
    >
      <span key={run} className="relative inline-block">
        <span className="flex font-syne font-extrabold text-xl tracking-[0.2em] leading-none text-stone-950">
          {LETTERS.map((ch, i) => {
            const founder = FOUNDERS[i];
            if (!run) return <span key={i} className="inline-block">{ch}</span>;
            if (!founder) {
              return <span key={i} className="inline-block arviik-ark-dim">{ch}</span>;
            }
            const delay = `${founder.order * STEP_MS}ms`;
            return (
              <span key={i} className="relative inline-block arviik-ark-lift" style={{ animationDelay: delay }}>
                {ch}
                {/* lime underline under the initial (letter width minus tracking) */}
                <span
                  aria-hidden="true"
                  className="arviik-ark-underline absolute left-0 right-[0.2em] -bottom-[5px] h-[2px] rounded-full bg-lime-400"
                  style={{ animationDelay: delay }}
                />
              </span>
            );
          })}
        </span>

      </span>
    </button>
  );
}
