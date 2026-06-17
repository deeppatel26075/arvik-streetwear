'use client';

import React, { useEffect, useState } from 'react';
import ProductDetailClient from './ProductDetailClient';
import Link from 'next/link';

interface ProductDetailFallbackProps {
  slug: string;
}

export default function ProductDetailFallback({ slug }: ProductDetailFallbackProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_custom_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((p: any) => p.slug === slug);
        if (found) {
          setProduct(found);
        }
      }
    } catch (e) {
      console.error('Failed to look up product in local storage:', e);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-xs font-bold uppercase tracking-widest text-stone-400">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 space-y-6">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
          Product Not Found
        </h1>
        <p className="text-stone-500 text-xs font-light max-w-sm mx-auto uppercase tracking-wider">
          The streetwear piece you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-stone-950 text-white font-bold uppercase text-xs tracking-widest px-6 py-3 hover:opacity-95 rounded-sm"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
