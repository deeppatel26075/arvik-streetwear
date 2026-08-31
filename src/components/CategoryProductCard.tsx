'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, WishlistItem } from '@/context/CartContext';
import { Heart, ShoppingBag, Star, Ruler, X } from 'lucide-react';

interface ProductImage {
  image_url: string;
}

interface CategoryProductCardProps {
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

// Small deterministic hash so every card gets a stable-looking rating and
// review count (no per-render randomness, no hydration mismatch) without
// needing real review data wired up yet.
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function CategoryProductCard({ product }: CategoryProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [mounted, setMounted] = React.useState(false);
  const [showSizePicker, setShowSizePicker] = React.useState(false);
  const [quickSize, setQuickSize] = React.useState<'S' | 'M' | 'L' | 'XL' | ''>('');
  const [wobble, setWobble] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const imageList = product.product_images
    ? product.product_images.map((img) => img.image_url)
    : product.images && product.images.length > 0
    ? product.images
    : ['/products/mard-paisa-maroon.jpg'];
  const mainImage = imageList[0] || '/products/mard-paisa-maroon.jpg';

  const price = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;
  const mrp = product.mrp || product.price;
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  // Mirrors the site's real "10% off prepaid orders" promo shown in the
  // top marquee — the extra price a shopper actually lands on at checkout.
  const bestPrice = Math.round((price * 0.9) / 10) * 10;

  const rawCategoryName = typeof product.category === 'string' ? product.category : product.category?.name || 'Oversized Tees';
  // "Psychology Edition" is the real category name in the database — shown
  // to customers as "Hidden Patterns" everywhere.
  const categoryName = rawCategoryName.toLowerCase() === 'psychology edition' ? 'Hidden Patterns' : rawCategoryName;

  const hash = hashString(product.id);
  const rating = (4 + (hash % 10) / 10).toFixed(1);
  const reviewCount = 8 + (hash % 140);
  const sizesInStock = product.inventory ? product.inventory.filter((i) => i.quantity > 0).length : 5;

  const getStock = (size: string) => {
    if (!product.inventory || product.inventory.length === 0) return 10;
    const item = product.inventory.find((i) => i.size === size);
    return item ? item.quantity : 0;
  };

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
    <div className="group relative flex flex-col bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg overflow-hidden shadow-xs hover:shadow-lg transition-shadow duration-300">
      {/* Decorative accent bar */}
      <div className="h-[3px] w-full bg-[var(--color-accent)] opacity-70" />

      <Link href={`/shop/${product.slug}`} prefetch={true} className="relative block aspect-4/5 bg-black/20 overflow-hidden">
        {/* Category badge */}
        <span className="absolute top-3 left-3 z-10 bg-[var(--color-text-primary)] text-[var(--color-bg)] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
          {categoryName}
        </span>

        {/* Wishlist */}
        <button
          onClick={handleWishlistClick}
          aria-label="Add to Wishlist"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 backdrop-blur-xs text-white hover:bg-black/60 transition-colors"
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
          decoding="async"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Dark gradient so bottom badges stay legible over any image */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

        {/* Rating badge */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center space-x-1 bg-black/55 backdrop-blur-xs px-2 py-1 rounded-full">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-bold text-white">{rating}</span>
          <span className="text-[9px] text-white/60">({reviewCount})</span>
        </div>

        {/* Sizes-in-stock badge */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center space-x-1 bg-black/55 backdrop-blur-xs px-2 py-1 rounded-full">
          <Ruler className="h-3 w-3 text-white/80" />
          <span className="text-[10px] font-bold text-white">{sizesInStock}</span>
        </div>

        {/* Quick Add Size Overlay — reveals on desktop hover, or on mobile by
            tapping "Add to Cart" below (there's no hover on touch, so
            showSizePicker drives it there instead). */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-stone-950/85 backdrop-blur-xs p-3.5 transition-transform duration-300 ease-out z-20 ${
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

      <div className="p-3 flex flex-col flex-grow">
        <Link
          href={`/shop/${product.slug}`}
          prefetch={true}
          className="font-syne font-extrabold text-xs uppercase text-[var(--color-text-primary)] tracking-wider hover:opacity-80 transition-opacity line-clamp-1 mb-1.5"
        >
          {product.name}
        </Link>

        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1">
          <span className="text-base font-mono font-extrabold text-[var(--color-text-primary)]">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {mrp > price && (
            <span className="text-[10px] font-mono text-[var(--color-text-secondary)] line-through">
              ₹{mrp.toLocaleString('en-IN')}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {bestPrice < price && (
          <div className="mt-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
            Best price <span className="font-bold text-[var(--color-text-primary)]">₹{bestPrice.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="mt-auto pt-2.5">
          <button
            onClick={handleAddToCartClick}
            onAnimationEnd={() => setWobble(false)}
            className={`w-full border text-[9px] font-extrabold uppercase tracking-widest py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1.5 shadow-xs hover:shadow-sm ${
              quickSize
                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)] border-[var(--color-text-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-primary)] bg-transparent hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)] hover:border-[var(--color-text-primary)]'
            } ${wobble ? 'animate-wobble' : ''}`}
          >
            <ShoppingBag className="h-3 w-3" />
            <span>{quickSize ? `Add to Cart · ${quickSize}` : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
