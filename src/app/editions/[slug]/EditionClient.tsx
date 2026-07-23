'use client';

import React, { useEffect } from 'react';
import { useTheme, ThemePreset } from '@/context/ThemeContext';
import ProductCard from '@/components/ProductCard';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface EditionClientProps {
  edition: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    theme?: {
      preset_name?: string;
      primary_color?: string;
    };
  };
  products: any[];
}

export default function EditionClient({ edition, products }: EditionClientProps) {
  const { setThemePreset } = useTheme();

  useEffect(() => {
    const slugPreset = edition.slug as ThemePreset;
    setThemePreset(slugPreset);
    return () => {
      setThemePreset('chaos');
    };
  }, [edition, setThemePreset]);

  // Filter products by slug or matching logic
  const filteredProducts = products.filter((p) => 
    p.edition_id === edition.id || 
    (edition.slug === 'samurai' && p.slug.includes('samurai') || p.slug.includes('farebi')) ||
    (edition.slug === 'anime' && p.slug.includes('burgundy')) ||
    (edition.slug === 'vintage' && p.slug.includes('cream'))
  );

  const bannerStyles: Record<string, string> = {
    samurai: 'bg-[#dc2626] text-white',
    chaos: 'bg-[#111111] text-white',
    minimal: 'bg-[#faf7f2] text-[#111111] border border-[#ECECEC]',
    vintage: 'bg-[#7c2d12] text-white',
    anime: 'bg-[#a855f7] text-white'
  };

  const activeStyle = bannerStyles[edition.slug] || 'bg-[#111111] text-white';

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* 1. Header Banner */}
      <div className={`p-6 rounded-[18px] space-y-2 ${activeStyle}`}>
        <h1 className="font-bold text-lg uppercase tracking-widest">
          {edition.name.toUpperCase()}
        </h1>
        <p className="text-xs opacity-90 font-medium leading-relaxed">
          {edition.description || 'Wear your identity.'}
        </p>
      </div>

      {/* 2. Controls bar */}
      <div className="flex justify-between items-center border-b border-[#ECECEC] pb-3 text-xs font-bold uppercase tracking-widest text-[#111111]">
        <button className="flex items-center space-x-1.5 hover:opacity-75">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
        <button className="flex items-center space-x-1.5 hover:opacity-75">
          <span>Sort: Popularity</span>
          <ArrowUpDown className="h-3.5 w-3.5 text-[#666666]" />
        </button>
      </div>

      {/* 3. 2-column Products Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
