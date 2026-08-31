'use client';

import React from 'react';

// Decorative full-viewport backdrop for the "On Fire" category: your
// hand-drawn crimson eye-wall artwork, slowly drifting (Ken Burns), with
// rising embers, twinkling sparkles, a cinematic vignette, and a
// black-crimson scrim on top so page content stays legible. Drop the
// source image in at this path — until it exists the CSS background
// simply stays empty and the theme's plain crimson-dark background shows
// through, so nothing breaks in the meantime.
//   public/onfire/eyes-wall.jpg

// left%, size(px), delay(s), duration(s), horizontal drift(px)
const EMBERS: [number, number, number, number, number][] = [
  [6, 4, 0, 7.5, 14],
  [14, 3, 2.1, 8.5, -10],
  [22, 5, 4.6, 6.8, 18],
  [30, 3, 1.2, 9.2, -16],
  [38, 4, 3.4, 7.8, 12],
  [46, 3, 5.8, 8, -14],
  [54, 5, 0.6, 7.2, 16],
  [62, 3, 2.8, 9.6, -12],
  [70, 4, 4.2, 6.5, 20],
  [78, 3, 1.8, 8.8, -18],
  [86, 5, 6.2, 7, 14],
  [92, 3, 3.6, 9, -10],
];

// left%, top%, size(px), delay(s), duration(s)
const SPARKLES: [number, number, number, number, number][] = [
  [10, 18, 3, 0.4, 3.2],
  [24, 34, 2, 1.6, 2.6],
  [40, 12, 3, 2.4, 3.6],
  [58, 28, 2, 0.8, 2.9],
  [72, 16, 3, 3.2, 3.4],
  [84, 40, 2, 1.2, 2.7],
  [18, 58, 3, 2.8, 3.1],
  [50, 50, 2, 0.2, 2.5],
  [66, 62, 3, 1.9, 3.3],
  [90, 22, 2, 3.6, 2.8],
];

export default function OnFireBackdrop({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center animate-onfire-drift"
        style={{ backgroundImage: "url('/onfire/eyes-wall.jpg')" }}
      />

      {/* Rising embers */}
      <div className="absolute inset-0">
        {EMBERS.map(([left, size, delay, duration, drift], i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full animate-ember"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                background: 'radial-gradient(circle, #ffd27f 0%, #ff7a1f 55%, rgba(255,122,31,0) 100%)',
                boxShadow: '0 0 6px 1px rgba(255,140,50,0.8)',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                '--ember-drift': `${drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Twinkling sparkles */}
      <div className="absolute inset-0">
        {SPARKLES.map(([left, top, size, delay, duration], i) => (
          <span
            key={i}
            className="absolute rounded-full animate-sparkle"
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: '#fff3d6',
                boxShadow: '0 0 8px 2px rgba(255,214,140,0.9)',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Cinematic vignette for a premium, framed feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 40%, rgba(10,0,0,0.55) 100%)',
        }}
      />

      {/* Black-crimson scrim so foreground text/cards stay legible over the artwork */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(26,3,3,0.5) 0%, rgba(26,3,3,0.4) 40%, rgba(26,3,3,0.7) 75%, rgba(26,3,3,0.93) 100%)',
        }}
      />
    </div>
  );
}
