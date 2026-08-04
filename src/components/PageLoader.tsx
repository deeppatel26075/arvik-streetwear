'use client';

import React from 'react';

interface PageLoaderProps {
  fullScreen?: boolean;
}

export default function PageLoader({ fullScreen = false }: PageLoaderProps) {
  if (!fullScreen) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-stone-400 space-y-2">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-950 rounded-full animate-spin" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-600">
          Loading Collection...
        </span>
      </div>
    );
  }

  return null;
}
