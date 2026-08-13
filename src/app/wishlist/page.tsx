'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Trash2, ShoppingBag } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart({
      productId: item.id,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      image: item.image,
      slug: item.slug,
      size: 'M', // default size
      quantity: 1,
      maxStock: 10,
    });
    
    // Trigger Cart Drawer open
    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  if (wishlist.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-bold text-xl uppercase tracking-wider text-[#111111]">
          Your Wishlist is Empty
        </h1>
        <p className="text-[#666666] text-xs font-medium max-w-sm mx-auto uppercase tracking-wider">
          Save items you love here to shop them later.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="apple-button inline-flex items-center space-x-2 text-xs tracking-widest shadow-xs hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Discover Drops</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <h1 className="font-bold text-lg uppercase tracking-widest text-[#111111]">
        MY WISHLIST
      </h1>

      {/* Vertical list of wishlist cards */}
      <div className="space-y-4">
        {wishlist.map((item) => {
          const activePrice = item.discountPrice && item.discountPrice > 0 
            ? item.discountPrice 
            : item.price;

          return (
            <div
              key={item.id}
              className="apple-card p-4 flex space-x-4 items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-grow">
                <Link
                  href={`/shop/${item.slug}`}
                  className="relative aspect-3/4 w-16 bg-[#F7F7F7] rounded-[10px] overflow-hidden flex-shrink-0"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="space-y-1">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="font-bold text-xs uppercase text-[#111111] tracking-wider line-clamp-1 block hover:opacity-85"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs font-bold text-[#111111]">
                    {formatPrice(activePrice)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="bg-white border border-[#111111] text-[#111111] text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-[8px] hover:bg-[#F7F7F7] transition-all"
                >
                  ADD TO CART
                </button>
                <button
                  onClick={() => toggleWishlist(item)}
                  className="text-[#666666] hover:text-[#DC2626] p-1.5"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
