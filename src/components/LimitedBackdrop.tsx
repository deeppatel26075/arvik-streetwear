'use client';

import React from 'react';

// Decorative full-viewport backdrop for the Limited Edition category, like
// the holographic foil sticker on a limited sneaker drop: a pearl-silver
// page with a soft rainbow-pearl shimmer slowly travelling across it and
// fine foil lines catching the light. Kept pale and subtle so the products
// (on frosted-glass cards) stay the focus.

export default function LimitedBackdrop({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Pearl-silver base */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #f6f7fa 0%, #eceef3 45%, #e3e6ed 100%)' }} />

      {/* Iridescent shimmer: pastel spectrum, slowly travelling */}
      <div
        className="absolute inset-0 opacity-70 animate-holo-shift"
        style={{
          backgroundImage:
            'linear-gradient(115deg, rgba(255,214,232,0.75) 0%, rgba(220,211,255,0.75) 18%, rgba(201,242,255,0.75) 36%, rgba(212,255,233,0.7) 54%, rgba(255,240,207,0.7) 72%, rgba(255,214,232,0.75) 90%, rgba(220,211,255,0.75) 100%)',
          backgroundSize: '300% 300%',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Fine foil lines catching the light */}
      <div
        className="absolute inset-0 opacity-50 animate-holo-lines"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 10px, rgba(255,255,255,0.7) 11px, rgba(255,255,255,0) 13px)',
        }}
      />

      {/* A soft bright bloom, like light hitting the foil */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 15%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)' }}
      />
    </div>
  );
}
