'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, WishlistItem } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Heart, ShoppingBag } from 'lucide-react';

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
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);

  const images = product.product_images || [];
  const primaryImage = images[0]?.image_url || '/placeholder-tee.jpg';
  const secondaryImage = images[1]?.image_url || primaryImage;

  const activePrice = product.discount_price && product.discount_price > 0 
    ? product.discount_price 
    : product.price;
  
  const isDiscounted = product.discount_price !== undefined && product.discount_price !== null && product.discount_price > 0;

  const isFavorited = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: primaryImage,
      slug: product.slug,
    };
    toggleWishlist(wishItem);
  };

  // Get list of available sizes with quantity > 0
  const availableSizes = product.inventory
    ? product.inventory
        .filter((item) => item.quantity > 0)
        .map((item) => item.size)
    : ['S', 'M', 'L', 'XL', 'XXL']; // Fallback

  const handleQuickAdd = (size: 'S' | 'M' | 'L' | 'XL' | 'XXL', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAdding(true);
    
    // Find stock count
    const stockItem = product.inventory?.find((inv) => inv.size === size);
    const maxStock = stockItem ? stockItem.quantity : 10;

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: primaryImage,
      slug: product.slug,
      size,
      quantity: 1,
      maxStock,
    });

    setTimeout(() => {
      setAdding(false);
      // Trigger Cart Open
      const event = new CustomEvent('open-cart');
      window.dispatchEvent(event);
    }, 400);
  };

  return (
    <div
      className="group relative flex flex-col bg-white border border-stone-200/40 rounded-xs overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Wrapper */}
      <Link href={`/shop/${product.slug}`} className="relative block aspect-3/4 bg-stone-100 overflow-hidden">
        {/* Wishlist toggle */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-xs text-stone-900 shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors ${
              isFavorited ? 'fill-accent text-accent' : 'text-stone-700'
            }`}
          />
        </button>

        {/* Badges */}
        {isDiscounted && (
          <span className="absolute top-3 left-3 z-10 bg-yellow-400 text-stone-950 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-md">
            {Math.round(((product.price - activePrice) / product.price) * 100)}% OFF
          </span>
        )}

        {/* Primary/Secondary Image transition */}
        <div className="w-full h-full relative">
          {(hovered ? secondaryImage : primaryImage).startsWith('data:') ? (
            <img
              src={hovered ? secondaryImage : primaryImage}
              alt={product.name}
              className="object-cover w-full h-full absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-103"
            />
          ) : (
            <Image
              src={hovered ? secondaryImage : primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-103"
            />
          )}
        </div>

        {/* Quick Add Overlay on Hover */}
        <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 backdrop-blur-xs p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest mb-2 text-center">
            {adding ? 'Adding to Bag...' : 'Quick Add Size'}
          </p>
          <div className="flex justify-center space-x-1.5">
            {availableSizes.length === 0 ? (
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                Sold Out
              </span>
            ) : (
              availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => handleQuickAdd(size as any, e)}
                  disabled={adding}
                  className="bg-white hover:bg-stone-900 hover:text-white text-stone-950 font-bold text-xs w-8 h-8 rounded-sm transition-colors uppercase flex items-center justify-center border border-transparent hover:border-white"
                >
                  {size}
                </button>
              ))
            )}
          </div>
        </div>
      </Link>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-grow bg-white border-t border-stone-100">
        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">
          {product.category?.name || 'Streetwear'}
        </span>
        <Link
          href={`/shop/${product.slug}`}
          className="font-syne font-bold text-xs uppercase text-stone-900 tracking-wider hover:opacity-85 transition-opacity line-clamp-1 mb-1.5"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-center space-x-2">
          <span className="text-xs font-semibold text-stone-950">
            {formatPrice(activePrice)}
          </span>
          {isDiscounted && (
            <span className="text-[10px] text-stone-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
