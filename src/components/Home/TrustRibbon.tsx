'use client';

import React from 'react';

export default function TrustRibbon() {
  const points = [
    'FREE SHIPPING ACROSS INDIA',
    'EASY RETURNS & EXCHANGE',
    'CASH ON DELIVERY AVAILABLE'
  ];

  return (
    <section className="w-full bg-[#faf9f6] py-3.5 border-b border-stone-200/20 select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-10 md:gap-14 text-[8px] sm:text-[9px] text-stone-400 font-medium tracking-[0.3em] uppercase text-center font-sans">
        {points.map((point, index) => (
          <React.Fragment key={index}>
            <span className="hover:text-stone-700 transition-colors">{point}</span>
            {index < points.length - 1 && (
              <span className="hidden sm:inline text-stone-300 select-none">·</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
