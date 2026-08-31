'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { X, ShoppingBag, Heart, Star, Check, Sparkles } from 'lucide-react';

interface QuickViewModalProps {
  product: any;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('');
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [wobble, setWobble] = useState(false);

  if (!product) return null;

  const images = product.product_images && product.product_images.length > 0
    ? product.product_images.map((img: any) => img.image_url)
    : product.images && product.images.length > 0
    ? product.images
    : ['/products/mard-paisa-maroon.jpg'];

  const price = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;
  const mrp = product.mrp || product.price;
  const isDiscounted = mrp > price;
  const isWishlisted = isInWishlist(product.id);

  const rawCategoryName = typeof product.category === 'string' ? product.category : product.category?.name || 'Streetwear';
  // "Psychology Edition" is the real category name in the database — shown
  // to customers as "Hidden Patterns" everywhere.
  const categoryName = rawCategoryName.toLowerCase() === 'psychology edition' ? 'Hidden Patterns' : rawCategoryName;

  const getStock = (size: string) => {
    if (!product.inventory || product.inventory.length === 0) return 10;
    const item = product.inventory.find((i: any) => i.size === size);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (express = false) => {
    if (!selectedSize) {
      setSizeWarning(true);
      setWobble(false);
      requestAnimationFrame(() => setWobble(true));
      return;
    }
    const stockLimit = getStock(selectedSize);
    if (stockLimit <= 0) {
      setSizeWarning(true);
      setWobble(false);
      requestAnimationFrame(() => setWobble(true));
      return;
    }
    setSizeWarning(false);
    setAdded(true);
    addToCart({
      productId: product.id,
      name: product.name,
      price,
      discountPrice: product.discount_price,
      image: images[0],
      slug: product.slug,
      size: selectedSize,
      quantity: 1,
      maxStock: stockLimit,
    });

    setTimeout(() => {
      setAdded(false);
      onClose();
      if (!express) {
        window.dispatchEvent(new CustomEvent('open-cart'));
      } else {
        window.location.href = '/checkout';
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs select-none">
      <div className="bg-white border border-stone-200 w-full max-w-3xl rounded-xs shadow-2xl overflow-hidden relative animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-950 hover:bg-stone-200 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image Showcase */}
          <div className="bg-stone-100 relative aspect-3/4 md:aspect-auto h-72 md:h-auto overflow-hidden">
            <Image
              src={images[activeImgIdx] || images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                {images.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeImgIdx === idx ? 'bg-stone-950 w-5' : 'bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Controls */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block">
                    {categoryName}
                  </span>
                  <h2 className="font-syne font-extrabold text-xl uppercase tracking-wider text-stone-950">
                    {product.name}
                  </h2>
                </div>
                <button
                  onClick={() => toggleWishlist({
                    id: product.id,
                    name: product.name,
                    price,
                    discountPrice: product.discount_price,
                    image: images[0],
                    slug: product.slug,
                  })}
                  className="p-2 text-stone-700 hover:text-red-600 transition-colors"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-600 text-red-600' : ''}`} />
                </button>
              </div>

              {/* Price & Rating */}
              <div className="flex items-center justify-between border-y border-stone-100 py-2.5">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-mono font-extrabold text-stone-950">{formatPrice(price)}</span>
                  {isDiscounted && (
                    <span className="text-xs font-mono text-stone-400 line-through">{formatPrice(mrp)}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-amber-500 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>4.9 (148)</span>
                </div>
              </div>



              {/* Size Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-700 block">
                  Select Size <span className="text-red-500">*</span>: <span className="text-stone-950">{selectedSize || 'Choose'}</span>
                </label>
                <div className="flex gap-2">
                  {(['S', 'M', 'L', 'XL', 'XXL'] as const).map((sz) => {
                    const isAvailable = getStock(sz) > 0;
                    return (
                      <button
                        key={sz}
                        disabled={!isAvailable}
                        onClick={() => {
                          setSelectedSize(sz);
                          setSizeWarning(false);
                        }}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-xs border transition-all ${
                          !isAvailable
                            ? 'bg-stone-50 text-stone-300 border-stone-100 line-through cursor-not-allowed'
                            : selectedSize === sz
                            ? 'bg-stone-950 text-white border-stone-950 shadow-xs'
                            : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
                {sizeWarning && (
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                    ⚠️ Please select a size before adding to bag.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleAddToCart(false)}
                onAnimationEnd={() => setWobble(false)}
                disabled={added}
                className={`w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xs transition-all flex items-center justify-center space-x-2 shadow-md ${
                  wobble ? 'animate-wobble' : ''
                }`}
              >
                {added ? <Check className="h-4 w-4 text-emerald-400" /> : <ShoppingBag className="h-4 w-4" />}
                <span>{added ? 'ADDED TO BAG!' : 'ADD TO BAG'}</span>
              </button>

              <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 uppercase tracking-widest pt-1">
                <Link
                  href={`/shop/${product.slug}`}
                  onClick={onClose}
                  className="hover:text-stone-950 underline"
                >
                  View Full Product Details →
                </Link>
                <span>Pan-India Free Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
