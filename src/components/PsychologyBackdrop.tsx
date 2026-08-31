'use client';

import React from 'react';

// Decorative full-viewport backdrop for the Psychology Edition: a glowing
// point with thin white wire-like strands radiating outward and a tangled
// knot below, evoking a mind unraveling against pure black.
export default function PsychologyBackdrop({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <svg
        className="absolute inset-0 w-full h-full animate-psych-drift"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="psych-glow" cx="50%" cy="34%" r="14%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="500" cy="340" r="150" fill="url(#psych-glow)" />

        <g stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round">
          {/* strands radiating up and outward from the glowing point */}
          <path d="M500,340 C430,230 320,160 150,40" opacity="0.32" />
          <path d="M500,340 C470,190 400,90 300,-60" opacity="0.22" />
          <path d="M500,340 C520,190 490,80 440,-60" opacity="0.28" />
          <path d="M500,340 C550,220 610,120 740,10" opacity="0.26" />
          <path d="M500,340 C570,240 690,190 880,70" opacity="0.3" />
          <path d="M500,340 C420,270 260,250 60,290" opacity="0.18" />
          <path d="M500,340 C580,270 730,260 940,320" opacity="0.2" />
          <path d="M500,340 C450,240 360,130 210,-10" opacity="0.16" />
          <path d="M500,340 C540,160 610,50 690,-90" opacity="0.22" />
          <path d="M500,340 C600,300 760,320 920,260" opacity="0.15" />

          {/* tangled knot lower in the frame */}
          <path
            d="M180,760 C260,700 340,820 420,740 C500,660 460,800 540,760 C620,720 600,840 680,780 C760,720 720,660 820,700"
            opacity="0.28"
          />
          <path
            d="M160,800 C260,860 360,760 460,820 C560,880 540,740 640,800 C740,860 700,760 840,800"
            opacity="0.18"
          />
        </g>
      </svg>
    </div>
  );
}
