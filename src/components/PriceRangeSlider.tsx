'use client';

import React from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

// Two overlapping native range inputs sharing one visual track — the
// standard lightweight way to get a dual-handle slider without an
// external drag library.
export default function PriceRangeSlider({ min, max, valueMin, valueMax, onChange }: PriceRangeSliderProps) {
  const range = Math.max(max - min, 1);
  const minPct = ((valueMin - min) / range) * 100;
  const maxPct = ((valueMax - min) / range) * 100;

  return (
    <div className="space-y-3">
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-[var(--color-border)]" />
        <div
          className="absolute h-1 rounded-full bg-[var(--color-accent)]"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMin}
          onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={valueMax}
          onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
        />
      </div>

      <style jsx>{`
        .range-thumb::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 9999px;
          background: var(--color-accent);
          border: 2px solid var(--color-bg);
          box-shadow: 0 0 0 1px var(--color-border);
          cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 15px;
          height: 15px;
          border-radius: 9999px;
          background: var(--color-accent);
          border: 2px solid var(--color-bg);
          box-shadow: 0 0 0 1px var(--color-border);
          cursor: pointer;
        }
        .range-thumb::-webkit-slider-runnable-track {
          background: transparent;
        }
        .range-thumb::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
