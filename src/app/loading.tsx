import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <Image
        src="/arviik-mark.png"
        alt="ARVIIK"
        width={64}
        height={64}
        priority
        className="animate-pulse"
      />
    </div>
  );
}
