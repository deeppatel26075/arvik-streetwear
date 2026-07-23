'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, WishlistItem } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Heart, ShoppingBag, Star, ArrowLeft } from 'lucide-react';

interface ProductImage {
  image_url: string;
}

interface InventoryItem {
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
}

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discount_price?: number;
    fabric: string;
    gsm: string;
    fit_type: string;
    wash_instructions: string;
    description: string;
    category?: { name: string };
    product_images?: ProductImage[];
    inventory?: InventoryItem[];
  };
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('M');
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [adding, setAdding] = useState(false);

  const images = product.product_images || [];
  const primaryImage = images[activeImageIdx]?.image_url || '/placeholder-tee.jpg';

  const activePrice = product.discount_price && product.discount_price > 0 
    ? product.discount_price 
    : product.price;
  
  const isDiscounted = product.discount_price !== undefined && product.discount_price !== null && product.discount_price > 0;
  const isFavorited = isInWishlist(product.id);

  const sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL', 'XXL'];
  const getStock = (size: 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    if (!product.inventory) return 10;
    const item = product.inventory.find(i => i.size === size);
    return item ? item.quantity : 0;
  };

  const handleWishlistClick = () => {
    const wishItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: images[0]?.image_url || '/placeholder-tee.jpg',
      slug: product.slug,
    };
    toggleWishlist(wishItem);
  };

  const handleAddToCart = (redirectToCheck = false) => {
    if (!selectedSize) {
      setSizeWarning(true);
      return;
    }
    setSizeWarning(false);
    setAdding(true);

    const stockLimit = getStock(selectedSize);

    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      discountPrice: product.discount_price,
      image: images[0]?.image_url || '/placeholder-tee.jpg',
      slug: product.slug,
      size: selectedSize,
      quantity,
      maxStock: stockLimit || 10,
    });

    setTimeout(() => {
      setAdding(false);
      if (redirectToCheck) {
        router.push('/checkout');
      } else {
        const event = new CustomEvent('open-cart');
        window.dispatchEvent(event);
      }
    }, 300);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Return button */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-1.5 text-xs text-[#666666] hover:text-[#111111] uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main product block */}
      <div className="space-y-6">
        {/* Left Side Gallery + Right Thumbnails */}
        <div className="flex space-x-3 items-start">
          {/* Main Visual */}
          <div className="flex-grow relative aspect-3/4 bg-[#F7F7F7] rounded-[18px] overflow-hidden border border-[#ECECEC]">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              priority
            />
            {/* Wishlist toggle */}
            <button
              onClick={handleWishlistClick}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-[#111111] shadow-xs hover:bg-white transition-colors border border-[#ECECEC]"
            >
              <Heart
                className={`h-4.5 w-4.5 transition-colors ${
                  isFavorited ? 'fill-[#111111] text-[#111111]' : 'text-[#666666]'
                }`}
              />
            </button>
          </div>

          {/* Vertical Thumbnails on the Right */}
          <div className="flex flex-col gap-2 w-16 flex-shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIdx(i)}
                className={`relative aspect-3/4 bg-[#F7F7F7] border rounded-[10px] overflow-hidden transition-all ${
                  activeImageIdx === i ? 'border-[#111111] shadow-xs' : 'border-[#ECECEC] opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.image_url}
                  alt={`${product.name} look ${i + 1}`}
                  fill
                  sizes="60px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details info */}
        <div className="space-y-4 pt-2">
          <div>
            <h1 className="font-bold text-lg uppercase tracking-wider text-[#111111]">
              {product.name}
            </h1>
          </div>

          {/* Pricing with OFF percentage */}
          <div className="flex items-center space-x-3 pb-3 border-b border-[#ECECEC]">
            <span className="text-base font-bold text-[#111111]">
              {formatPrice(activePrice)}
            </span>
            {isDiscounted && (
              <>
                <span className="text-xs text-[#666666] line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-[#DC2626] font-bold">
                  ({Math.round(((product.price - activePrice) / product.price) * 100)}% OFF)
                </span>
              </>
            )}
          </div>

          {/* Star review summary */}
          <div className="flex items-center space-x-1 text-xs text-[#111111] font-bold">
            <div className="flex space-x-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-[#111111] text-[#111111]" />
              ))}
            </div>
            <span>4.8 (123 reviews)</span>
          </div>

          {/* Color select summary */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">
              Color: Black
            </p>
            <div className="flex space-x-2">
              <span className="w-5 h-5 rounded-full bg-black border border-[#ECECEC] cursor-pointer" />
              <span className="w-5 h-5 rounded-full bg-[#7c2d12] border border-[#ECECEC] cursor-pointer" />
              <span className="w-5 h-5 rounded-full bg-[#faf7f2] border border-[#ECECEC] cursor-pointer" />
            </div>
          </div>

          {/* Size select grid */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">
              Size: {selectedSize || 'None'}
            </p>
            <div className="flex space-x-2">
              {sizes.map((size) => {
                const stock = getStock(size);
                const isAvailable = stock > 0;
                return (
                  <button
                    key={size}
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeWarning(false);
                    }}
                    className={`border font-bold text-xs w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors uppercase ${
                      selectedSize === size
                        ? 'bg-white text-[#111111] border-[#111111] border-2 shadow-xs'
                        : !isAvailable
                        ? 'border-[#F7F7F7] text-stone-300 cursor-not-allowed line-through bg-[#F7F7F7]'
                        : 'border-[#ECECEC] text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Add and Buy */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={adding}
              className="flex-1 bg-white border border-[#111111] text-[#111111] text-xs font-bold uppercase tracking-widest py-3.5 hover:bg-[#F7F7F7] transition-all rounded-[10px] flex items-center justify-center space-x-2"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>ADD TO CART</span>
            </button>
            
            <button
              onClick={() => handleAddToCart(true)}
              disabled={adding}
              className="flex-1 bg-[#111111] text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-all rounded-[10px]"
            >
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
