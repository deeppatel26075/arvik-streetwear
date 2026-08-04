'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCart, WishlistItem } from '@/context/CartContext';
import { Heart, ShoppingBag, Eye } from 'lucide-react';

const QuickViewModal = dynamic(() => import('@/components/QuickViewModal'), {
  ssr: false,
});

interface ProductImage {
  image_url: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount_price?: number;
    mrp?: number;
    category?: string | { name: string };
    product_images?: ProductImage[];
    images?: string[];
    inventory?: { size: 'S' | 'M' | 'L' | 'XL' | 'XXL'; quantity: number }[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [mounted, setMounted] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const imageList = product.product_images
    ? product.product_images.map(img => img.image_url)
    : product.images && product.images.length > 0
    ? product.images
    : ['/products/mard-paisa-maroon.jpg'];

  const mainImage = imageList[0] || '/products/mard-paisa-maroon.jpg';

  const price = product.discount_price && product.discount_price > 0
    ? product.discount_price
    : product.price;

  const mrp = product.mrp || product.price;
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const categoryName = typeof product.category === 'string'
    ? product.category
    : product.category?.name || 'Oversized Tees';

  const isFavorited = mounted ? isInWishlist(product.id) : false;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price,
      discountPrice: product.discount_price,
      image: mainImage,
      slug: product.slug,
    };
    toggleWishlist(wishItem);
  };

  const handleQuickAdd = (size: 'S' | 'M' | 'L' | 'XL', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      productId: product.id,
      name: product.name,
      price,
      discountPrice: product.discount_price,
      image: mainImage,
      slug: product.slug,
      size,
      quantity: 1,
      maxStock: 10,
    });

    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  return (
    <>
      <div className="group relative flex flex-col bg-white border border-stone-200/40 rounded-xs overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300">
        <Link href={`/shop/${product.slug}`} prefetch={true} className="relative block aspect-3/4 bg-stone-100 overflow-hidden">
          {/* Wishlist & QuickView Buttons */}
          <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5">
            <button
              onClick={handleWishlistClick}
              className="p-2 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-sm hover:bg-white transition-colors"
              aria-label="Add to Wishlist"
            >
              <Heart className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-stone-900 text-stone-900' : 'text-stone-700'}`} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-sm hover:bg-white transition-colors"
              title="Quick View"
            >
              <Eye className="h-4 w-4 text-stone-700" />
            </button>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 z-10 bg-amber-400 text-stone-950 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-md">
              {discountPercent}% OFF
            </span>
          )}

          {/* Image */}
          <div className="w-full h-full relative">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
              decoding="async"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-103"
            />
          </div>

          {/* Quick Add Overlay on Desktop Hover */}
          <div className="hidden md:block absolute inset-x-0 bottom-0 bg-stone-950/80 backdrop-blur-xs p-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
            <p className="text-[9px] text-stone-300 font-extrabold uppercase tracking-widest mb-1.5 text-center">
              Quick Add Size
            </p>
            <div className="flex justify-center space-x-1.5">
              {(['S', 'M', 'L', 'XL'] as const).map((s) => (
                <button
                  key={s}
                  onClick={(e) => handleQuickAdd(s, e)}
                  className="bg-white hover:bg-stone-900 hover:text-white text-stone-950 font-bold text-xs w-8 h-8 rounded-xs transition-colors uppercase flex items-center justify-center border border-transparent hover:border-white cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Link>

        {/* Info Container */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-grow bg-white border-t border-stone-100">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-widest mb-0.5">
            {categoryName}
          </span>
          <Link
            href={`/shop/${product.slug}`}
            prefetch={true}
            className="font-syne font-extrabold text-xs uppercase text-stone-950 tracking-wider hover:text-stone-700 transition-colors line-clamp-1 mb-1"
          >
            {product.name}
          </Link>
          <div className="flex items-center space-x-2 mb-2.5">
            <span className="text-xs font-mono font-extrabold text-stone-950">₹{price.toLocaleString('en-IN')}</span>
            {mrp > price && (
              <span className="text-[10px] font-mono text-stone-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className="mt-auto pt-2 border-t border-stone-100/70">
            <button
              onClick={(e) => handleQuickAdd('M', e)}
              className="w-full border border-stone-200 text-stone-900 bg-white hover:bg-stone-950 hover:text-white text-[10px] font-extrabold uppercase tracking-widest py-2 rounded-xs transition-colors duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
}
