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
      <div className="flex justify-center items-center py-24 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="font-bold text-xl uppercase tracking-wider text-[#111111]">
          Product Not Found
        </h1>
        <p className="text-[#666666] text-xs font-medium max-w-sm mx-auto uppercase tracking-wider">
          The streetwear piece you are looking for does not exist or has been removed.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="apple-button inline-block text-xs tracking-widest shadow-xs hover:opacity-90"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
