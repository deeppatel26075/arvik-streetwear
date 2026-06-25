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
      className="group relative flex flex-col bg-white border border-stone-200 rounded-sm overflow-hidden shadow-2xs hover:shadow-sm transition-shadow duration-300 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Viewer */}
      <Link
        href={`/shop/${product.slug}`}
        onClick={handleProductClick}
        className="relative block aspect-3/4 bg-stone-50 overflow-hidden"
      >
        {/* Floating Wishlist Heart */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 shadow-xs hover:bg-white transition-colors"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorited ? 'fill-sale text-sale animate-pulse' : 'text-stone-600'
            }`}
          />
        </button>

        {/* Top-Left Bestseller tag: Solid green background as in Veirdo photo */}
        <span className="absolute top-2.5 left-2.5 z-10 bg-[#0f8a5f] text-white text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-xs shadow-xs">
          BEST SELLER
        </span>

        {/* Bottom-Left Rating Badges */}
        <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 px-2 py-0.5 rounded-full flex items-center space-x-1 text-[9px] font-bold text-stone-850 shadow-xs border border-stone-100">
          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          <span>{product.rating || 4.5}</span>
          <span className="text-stone-300">|</span>
          <span className="text-stone-500 font-semibold">{product.reviews || 320}</span>
        </div>

        {/* Bottom-Right Color Swatches indicators */}
        <div className="absolute bottom-2.5 right-2.5 z-10 bg-white/95 px-2 py-0.5 rounded-full flex items-center space-x-1 text-[9px] font-bold text-stone-500 shadow-xs border border-stone-100">
          <div className="flex space-x-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-100 border border-stone-300 inline-block" />
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          </div>
        </div>

        {/* Primary/Secondary Image swaps */}
        <div className="w-full h-full relative">
          {primaryImage.startsWith('http') || primaryImage.startsWith('/') ? (
            <img
              src={hovered ? secondaryImage : primaryImage}
              alt={product.name}
              className="object-cover w-full h-full absolute inset-0 transition-transform duration-500 group-hover:scale-102"
            />
          ) : (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-102"
            />
          )}
        </div>
      </Link>

      {/* Product Details info */}
      <div className="p-3.5 flex flex-col flex-grow bg-white space-y-1">
        {/* Brand label */}
        <span className="text-[8px] text-stone-400 font-bold uppercase tracking-widest">
          ARVIIK CLOTHING
        </span>
        
        {/* Pricing Row (MRP, Price, Discount in Green) - Placed BEFORE title as in photo */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-black text-stone-950">
            {formatPrice(priceVal)}
          </span>
          <span className="text-[10px] text-stone-400 line-through">
            {formatPrice(mrpVal)}
          </span>
          <span className="text-[10px] text-emerald-600 font-black">
            {discountVal}% OFF
          </span>
        </div>

        {/* Best Price Capsule (Bullet + Green text) */}
        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-600 font-black">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Best price {formatPrice(bestPriceVal)}</span>
        </div>

        {/* Title - Placed AFTER prices as in photo */}
        <Link
          href={`/shop/${product.slug}`}
          onClick={handleProductClick}
          className="text-stone-500 hover:text-stone-950 text-xs font-semibold line-clamp-2 leading-tight tracking-normal pb-2"
        >
          {product.name}
        </Link>

        {/* Action Button: ADD TO CART */}
        <div className="mt-auto border-t border-stone-100/60 pt-3">
          {!showSizes ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSizes(true);
              }}
              className="w-full border border-stone-300 text-stone-900 bg-white hover:bg-stone-950 hover:text-white hover:border-stone-950 text-[10px] font-black uppercase tracking-widest py-2 rounded-sm transition-all duration-200 flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <span>ADD TO CART</span>
            </button>
          ) : (
            <div className="flex items-center justify-between space-x-1">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">SIZE:</span>
              <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={(e) => handleQuickAdd(size as any, e)}
                    disabled={adding}
                    className="bg-stone-100 hover:bg-stone-950 hover:text-white text-stone-900 font-bold text-[9px] w-6.5 h-6.5 rounded-full transition-colors flex items-center justify-center border border-stone-200 hover:border-stone-950"
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
                className="text-stone-400 hover:text-stone-900 p-0.5"
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
