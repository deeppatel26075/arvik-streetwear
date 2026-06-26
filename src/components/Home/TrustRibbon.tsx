'use client';

import React from 'react';

export default function TrustRibbon() {
  const points = [
    'FREE SHIPPING ACROSS INDIA',
    'EASY RETURNS & EXCHANGE',
    'CASH ON DELIVERY AVAILABLE'
  ];

  return (
    <section className="w-full bg-[#faf9f6] py-4 border-b border-stone-200/40 select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-12 md:gap-16 text-[9px] sm:text-[10px] text-stone-500 font-semibold tracking-[0.25em] uppercase text-center font-sans">
        {points.map((point, index) => (
          <React.Fragment key={index}>
            <span className="hover:text-stone-800 transition-colors">{point}</span>
            {index < points.length - 1 && (
              <span className="hidden sm:inline text-stone-300 font-light select-none">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
