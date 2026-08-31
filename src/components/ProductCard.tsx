'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCart, WishlistItem } from '@/context/CartContext';
import { Heart, ShoppingBag, Eye, X } from 'lucide-react';

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
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [quickSize, setQuickSize] = useState<'S' | 'M' | 'L' | 'XL' | ''>('');
  const [wobble, setWobble] = useState(false);

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

  const rawCategoryName = typeof product.category === 'string'
    ? product.category
    : product.category?.name || 'Oversized Tees';
  // "Psychology Edition" is the real category name in the database — shown
  // to customers as "Hidden Patterns" everywhere.
  const categoryName = rawCategoryName.toLowerCase() === 'psychology edition' ? 'Hidden Patterns' : rawCategoryName;

  const isFavorited = mounted ? isInWishlist(product.id) : false;

  const getStock = (size: string) => {
    if (!product.inventory || product.inventory.length === 0) return 10;
    const item = product.inventory.find((i) => i.size === size);
    return item ? item.quantity : 0;
  };

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

  // Single Add to Cart button does double duty: with no size chosen yet it
  // opens the picker (mandatory-size nudge via wobble); once a size has
  // been picked, tapping it again actually adds to cart — no second
  // "Add to Cart" button duplicated right under the sizes.
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickSize) {
      addToCart({
        productId: product.id,
        name: product.name,
        price,
        discountPrice: product.discount_price,
        image: mainImage,
        slug: product.slug,
        size: quickSize,
        quantity: 1,
        maxStock: getStock(quickSize),
      });
      setQuickSize('');
      window.dispatchEvent(new CustomEvent('open-cart'));
      return;
    }
    setShowSizePicker(true);
    setWobble(false);
    requestAnimationFrame(() => setWobble(true));
  };

  return (
    <>
      <div className="group relative flex flex-col bg-white border border-stone-200/40 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300">
        <Link href={`/shop/${product.slug}`} prefetch={true} className="relative block aspect-3/4 bg-stone-100 overflow-hidden">
          {/* Wishlist & QuickView Buttons */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col space-y-1 sm:space-y-1.5">
            <button
              onClick={handleWishlistClick}
              className="p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-sm hover:bg-white transition-colors"
              aria-label="Add to Wishlist"
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${isFavorited ? 'fill-stone-900 text-stone-900' : 'text-stone-700'}`} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-sm hover:bg-white transition-colors"
              title="Quick View"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-stone-700" />
            </button>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-amber-400 text-stone-950 text-[9px] sm:text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 sm:px-2 rounded-md shadow-md">
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

          {/* Quick Add Overlay — reveals on desktop hover, or on mobile by
              tapping "Add to Cart" below (there's no hover on touch, so
              showSizePicker drives it there instead). */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-stone-950/80 backdrop-blur-xs p-3.5 transition-transform duration-300 ease-out z-10 ${
              showSizePicker ? 'translate-y-0' : 'translate-y-full'
            } md:group-hover:translate-y-0`}
          >
            {showSizePicker && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSizePicker(false);
                  setQuickSize('');
                }}
                className="md:hidden absolute top-2 right-2 p-1 text-stone-300 hover:text-white"
                aria-label="Close size picker"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <p className="text-[9px] text-stone-300 font-extrabold uppercase tracking-widest mb-1.5 text-center">
              Select Size <span className="text-red-500">*</span>
            </p>
            <div className="flex justify-center space-x-1.5">
              {(['S', 'M', 'L', 'XL'] as const).map((s) => {
                const isAvailable = getStock(s) > 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!isAvailable}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuickSize(s);
                      setShowSizePicker(false);
                    }}
                    className={`font-bold text-xs w-8 h-8 rounded-xs transition-colors uppercase flex items-center justify-center border ${
                      !isAvailable
                        ? 'bg-stone-800 text-stone-500 border-transparent line-through cursor-not-allowed'
                        : 'bg-white hover:bg-stone-900 hover:text-white text-stone-950 border-transparent hover:border-white cursor-pointer'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </Link>

        {/* Info Container */}
        <div className="p-2.5 sm:p-3.5 flex flex-col flex-grow bg-white border-t border-stone-100">
          <span className="text-[8px] sm:text-[9px] text-stone-400 font-extrabold uppercase tracking-widest mb-0.5">
            {categoryName}
          </span>
          <Link
            href={`/shop/${product.slug}`}
            prefetch={true}
            className="font-syne font-extrabold text-[11px] sm:text-xs uppercase text-stone-950 tracking-wider hover:text-stone-700 transition-colors line-clamp-1 mb-1"
          >
            {product.name}
          </Link>
          <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2">
            <span className="text-[11px] sm:text-xs font-mono font-extrabold text-stone-950">₹{price.toLocaleString('en-IN')}</span>
            {mrp > price && (
              <span className="text-[9px] sm:text-[10px] font-mono text-stone-400 line-through">₹{mrp.toLocaleString('en-IN')}</span>
            )}
          </div>
          <div className="mt-auto pt-1.5 sm:pt-2 border-t border-stone-100/70">
            <button
              onClick={handleAddToCartClick}
              onAnimationEnd={() => setWobble(false)}
              className={`w-full border text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest py-1.5 sm:py-2 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer shadow-2xs ${
                quickSize
                  ? 'bg-stone-950 text-white border-stone-950'
                  : 'border-stone-200 text-stone-900 bg-white hover:bg-stone-950 hover:text-white'
              } ${wobble ? 'animate-wobble' : ''}`}
            >
              <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{quickSize ? `Add to Cart · ${quickSize}` : 'Add to Cart'}</span>
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
