'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Floating "Ask Aris" button. The chat panel itself is code-split and only
// downloaded the first time someone opens it, so Aris costs every other
// visitor nothing but this button.
const ArisPanel = dynamic(() => import('./ArisPanel'), { ssr: false });

export default function ArisLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [launching, setLaunching] = useState(false);

  if (pathname?.startsWith('/admin')) return null;

  // Tap: a lime ripple + the A mark spins, then the panel opens with a
  // circular reveal from this corner. The panel's code starts loading on
  // the tap itself, so the animation covers the download.
  const openPanel = () => {
    if (launching) return;
    setLoaded(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpen(true);
      return;
    }
    setLaunching(true);
    setTimeout(() => {
      setOpen(true);
      setLaunching(false);
    }, 260);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label="Chat with Aris, ARVIIK's assistant"
          className={`aris-launcher fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-stone-950 text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)] hover:bg-stone-800 active:scale-95 transition-colors [-webkit-tap-highlight-color:transparent] ${
            launching ? 'aris-launcher-press' : 'aris-launcher-in'
          }`}
        >
          <span className="relative inline-flex">
            {launching && <span aria-hidden="true" className="aris-ripple absolute inset-0 rounded-full border-2 border-lime-400" />}
            {launching && <span aria-hidden="true" className="aris-ripple absolute inset-0 rounded-full border border-lime-300" style={{ animationDelay: '90ms' }} />}
            <ArisMark className={`h-8 w-8 ${launching ? 'aris-mark-spin' : ''}`} />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em]">Ask Aris</span>
        </button>
      )}
      {loaded && <ArisPanel open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

export function ArisMark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center rounded-full bg-lime-400 text-stone-950 font-syne font-extrabold text-sm ${className}`}
    >
      A
      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white ring-2 ring-stone-950" />
    </span>
  );
}
