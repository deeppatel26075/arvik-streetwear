'use client';

import React, { useEffect, useState } from 'react';

export default function ArviikPageAnimation() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Smooth, ultra-fast 550ms animation that never blocks interaction
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 450);

    const timer2 = setTimeout(() => {
      setVisible(false);
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-white transition-all duration-400 ease-out select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-3 px-4 text-center">
        {/* Animated ARVIIK Logo Typography */}
        <div className="relative flex flex-col items-center">
          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl tracking-[0.4em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-white to-stone-200 animate-pulse">
            ARVIIK
          </h1>

          {/* Glowing Lime Line Reveal */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-lime-400 to-transparent mt-2 transition-all duration-500 scale-x-100" />
        </div>

        <span className="text-[9px] font-extrabold uppercase tracking-[0.45em] text-stone-400 pt-1">
          WEAR YOUR IDENTITY
        </span>
      </div>
    </div>
  );
}
