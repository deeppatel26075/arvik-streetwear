'use client';

import React, { useEffect, useState } from 'react';

interface PageLoaderProps {
  fullScreen?: boolean;
}

export default function PageLoader({ fullScreen = true }: PageLoaderProps) {
  const fullText = 'ARVIIK';
  const [displayedText, setDisplayedText] = useState('A');
  const [showUnderline, setShowUnderline] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Skip loader on repeat session visits for lightning fast navigation
    if (typeof window !== 'undefined' && sessionStorage.getItem('arviik_loader_seen')) {
      setVisible(false);
      return;
    }

    let index = 1;
    const interval = setInterval(() => {
      index++;
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
      } else {
        clearInterval(interval);
        setShowUnderline(true);
        setShowSubtext(true);

        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setVisible(false);
            try {
              sessionStorage.setItem('arviik_loader_seen', 'true');
            } catch (e) {}
          }, 300);
        }, 200);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  if (fullScreen) {
    if (!visible) return null;
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950 text-white transition-opacity duration-500 ${
          fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center space-y-4 px-4 text-center">
          {/* Animated A -> ARVIIK Typography */}
          <div className="relative flex flex-col items-center space-y-2">
            <h1 className="font-syne font-extrabold text-5xl sm:text-7xl lg:text-8xl tracking-[0.3em] sm:tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-stone-300 via-white to-stone-300 uppercase transition-all duration-300 min-h-[1.2em] flex items-center justify-center">
              {displayedText}
              <span className="inline-block w-1.5 h-10 sm:h-14 bg-lime-400 ml-2 animate-pulse rounded-full" />
            </h1>

            {/* Expanding Accent Line */}
            <div
              className={`h-[2px] bg-gradient-to-r from-transparent via-lime-400 to-transparent transition-all duration-500 ${
                showUnderline ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            />
          </div>

          {/* Tagline Fade In */}
          <div
            className={`transition-all duration-500 ${
              showSubtext ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.45em] text-stone-400 pt-2">
              WEAR YOUR IDENTITY
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Non-fullscreen component fallback
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center bg-stone-950 text-white rounded-xs border border-stone-800 my-8">
      <div className="flex flex-col items-center space-y-3 px-4 text-center">
        <h2 className="font-syne font-extrabold text-3xl sm:text-4xl tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-stone-300 via-white to-stone-300 animate-pulse uppercase">
          {displayedText}
        </h2>
        <div className="h-[2px] w-36 bg-gradient-to-r from-transparent via-lime-400 to-transparent animate-pulse" />
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-stone-400 pt-1">
          Loading Collection...
        </p>
      </div>
    </div>
  );
}
