import React from 'react';

export default function Loading() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center py-20 bg-white">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-7 h-7 border-2 border-stone-200 border-t-stone-950 rounded-full animate-spin" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500">
          Loading ARVIIK...
        </span>
      </div>
    </div>
  );
}
