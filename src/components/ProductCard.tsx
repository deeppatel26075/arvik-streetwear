'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, WishlistItem } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Heart, ShoppingBag, X, Star } from 'lucide-react';
import { analytics } from '@/lib/analytics';

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
    category?: { name: string };
    product_images?: ProductImage[];
    inventory?: { size: 'S' | 'M' | 'L' | 'XL' | 'XXL'; quantity: number }[];
    rating?: number;
    reviews?: number;
    mrp?: number;
    discount?: number;
    colors?: string[];
    tags?: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showSizes, setShowSizes] = useState(false);

  const images = product.product_images || [];
  const primaryImage = images[0]?.image_url || '/placeholder-tee.jpg';
  const secondaryImage = images[1]?.image_url || primaryImage;

  // Pricing adapters
  const mrpVal = product.mrp || product.price || 1499;
  const priceVal = product.discount_price || product.price || 599;
  const discountVal = product.discount || Math.round(((mrpVal - priceVal) / mrpVal) * 100);

  // Best Price calculation (coupon simulation)
  const bestPriceVal = Math.round(priceVal * 0.75);

  const isFavorited = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: mrpVal,
      discountPrice: priceVal,
      image: primaryImage,
      slug: product.slug,
    };
    toggleWishlist(wishItem);
  };

  const availableSizes = product.inventory
    ? product.inventory
        .filter((item) => item.quantity > 0)
        .map((item) => item.size)
    : ['S', 'M', 'L', 'XL']; // Fallback

  const handleQuickAdd = (size: 'S' | 'M' | 'L' | 'XL' | 'XXL', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAdding(true);
    const stockItem = product.inventory?.find((inv) => inv.size === size);
    const maxStock = stockItem ? stockItem.quantity : 10;

    addToCart({
      productId: product.id,
      name: product.name,
      price: mrpVal,
      discountPrice: priceVal,
      image: primaryImage,
      slug: product.slug,
      size,
      quantity: 1,
      maxStock,
    });

    // Trigger Analytics
    analytics.trackAddToCart(product.id, product.name, size, priceVal);

    setTimeout(() => {
      setAdding(false);
      setShowSizes(false);
      // Trigger Cart Drawer
      const event = new CustomEvent('open-cart');
      window.dispatchEvent(event);
    }, 400);
  };

  const handleProductClick = () => {
    analytics.trackProductViewed(product.id, product.name, priceVal);
  };

  return (
    <div
      className="group relative flex flex-col bg-transparent overflow-hidden transition-all duration-300 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Viewer */}
      <Link
        href={`/shop/${product.slug}`}
        onClick={handleProductClick}
        className="relative block aspect-3/4 bg-[#fbfbfb] overflow-hidden"
      >
        {/* Floating Wishlist Heart */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-900 shadow-sm transition-transform active:scale-95"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              isFavorited ? 'fill-sale text-sale' : 'text-stone-700'
            }`}
          />
        </button>

        {/* Top-Left Bestseller tag: Minimalist premium look */}
        {product.tags?.includes('BESTSELLER') && (
          <span className="absolute top-3 left-3 z-10 bg-[#faf9f6]/95 backdrop-blur-xs text-stone-800 text-[8px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1.5 border border-stone-200/50">
            Exclusive
          </span>
        )}

        {/* Primary/Secondary Image swaps */}
        <div className="w-full h-full relative">
          {primaryImage.startsWith('http') || primaryImage.startsWith('/') ? (
            <img
              src={hovered ? secondaryImage : primaryImage}
              alt={product.name}
              className="object-cover w-full h-full absolute inset-0 transition-transform duration-700 group-hover:scale-101"
            />
          ) : (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-101"
            />
          )}
        </div>
      </Link>

      {/* Product Details info */}
      <div className="pt-4 pb-2 px-0.5 flex flex-col flex-grow bg-transparent space-y-1">
        {/* Title */}
        <Link
          href={`/shop/${product.slug}`}
          onClick={handleProductClick}
          className="text-stone-900 hover:text-secondary text-[11px] font-medium tracking-[0.1em] transition-colors uppercase leading-tight font-sans"
        >
          {product.name}
        </Link>
        
        {/* Pricing Row */}
        <div className="flex items-center space-x-2 text-[11px] font-sans pt-0.5">
          <span className="font-semibold text-stone-900">
            {formatPrice(priceVal)}
          </span>
          {mrpVal > priceVal && (
            <>
              <span className="text-[10px] text-stone-400 line-through">
                {formatPrice(mrpVal)}
              </span>
              <span className="text-[9px] text-sale font-medium tracking-wide">
                ({discountVal}% OFF)
              </span>
            </>
          )}
        </div>

        {/* Action Button: ADD TO BAG */}
        <div className="mt-auto pt-2.5">
          {!showSizes ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSizes(true);
              }}
              className="w-full bg-transparent border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white text-[9px] font-semibold uppercase tracking-[0.2em] py-2.5 transition-colors flex items-center justify-center rounded-none"
            >
              <span>ADD TO BAG</span>
            </button>
          ) : (
            <div className="flex items-center justify-between space-x-1 py-1">
              <span className="text-[8px] font-semibold text-stone-400 uppercase tracking-[0.15em] font-sans">SIZE:</span>
              <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-none">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={(e) => handleQuickAdd(size as any, e)}
                    disabled={adding}
                    className="bg-white hover:bg-stone-900 hover:text-white text-stone-600 font-medium text-[9px] w-7 h-7 rounded-none transition-colors flex items-center justify-center border border-stone-200 hover:border-stone-900 font-sans"
                  >
                    {size}
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSizes(false);
                }}
                className="text-stone-400 hover:text-stone-900 p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
