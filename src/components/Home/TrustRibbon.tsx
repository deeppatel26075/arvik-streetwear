'use client';

import React from 'react';
import { Users, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

export default function TrustRibbon() {
  const points = [
    { label: 'FREE SHIPPING', icon: Truck },
    { label: 'EASY RETURNS', icon: RotateCcw },
    { label: 'COD AVAILABLE', icon: ShieldCheck }
  ];

  return (
    <section className="w-full bg-primary py-4 border-y border-stone-850 select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-6 sm:gap-12 md:gap-16">
        {points.map((point, index) => {
          const Icon = point.icon;
          return (
            <div key={index} className="flex items-center space-x-2.5 text-white">
              <Icon className="h-4 w-4 text-accent" />
              <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
