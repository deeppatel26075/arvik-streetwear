'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Clock } from 'lucide-react';

export default function RecentlyViewed() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_recently_viewed');
      if (stored) {
        setItems(JSON.parse(stored).slice(0, 6));
      }
    } catch (e) {
      console.error('Failed loading recently viewed items:', e);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-stone-200/60 select-none">
      <div className="flex items-center space-x-2 pb-4">
        <Clock className="h-4 w-4 text-stone-500" />
        <h3 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-950">
          Recently Viewed Pieces
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {items.map((item) => (
          <Link
            key={item.id || item.slug}
            href={`/shop/${item.slug}`}
            className="group bg-white border border-stone-200/80 rounded-xs p-2 hover:shadow-md transition-all space-y-2"
          >
            <div className="relative aspect-3/4 bg-stone-100 rounded-xs overflow-hidden">
              <Image
                src={item.image || '/products/mard-paisa-maroon.jpg'}
                alt={item.name}
                fill
                sizes="150px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-syne font-bold text-[11px] uppercase tracking-wide text-stone-900 line-clamp-1 group-hover:text-stone-600 transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] font-mono font-extrabold text-stone-950">
                {formatPrice(item.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
