'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, WishlistItem } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import ImageZoom from '@/components/ImageZoom';
import { Heart, ShoppingBag, Truck, Info, ChevronRight, HelpCircle, Award, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import SizeGuide from '@/components/Product/SizeGuide';
import Review from '@/components/Product/Review';
import ProductRecommendation from '@/components/Product/ProductRecommendation';
import { trackRecentlyViewed } from '@/components/Commerce/RecentlyViewed';
import { analytics } from '@/lib/analytics';

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
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('specs');

  const toggleAccordion = (tab: string) => {
    setActiveAccordion(activeAccordion === tab ? null : tab);
  };

  const images = product.product_images || [];
  const primaryImage = images[activeImageIdx]?.image_url || '/placeholder-tee.jpg';

  // Pricing adapters
  const mrpVal = product.price || 1499;
  const priceVal = product.discount_price || 599;
  const discountVal = Math.round(((mrpVal - priceVal) / mrpVal) * 100);
  const bestPriceVal = Math.round(priceVal * 0.75);

  const isFavorited = isInWishlist(product.id);

  // Track product view and recently viewed on mount
  useEffect(() => {
    trackRecentlyViewed(product.slug);
    analytics.trackProductViewed(product.id, product.name, priceVal);
  }, [product]);

  const getStock = (size: 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    if (!product.inventory) return 10;
    const item = product.inventory.find(i => i.size === size);
    return item ? item.quantity : 0;
  };

  const activeSizeStock = selectedSize ? getStock(selectedSize) : 0;

  const handleWishlistClick = () => {
    const wishItem: WishlistItem = {
      id: product.id,
      name: product.name,
      price: mrpVal,
      discountPrice: priceVal,
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
      price: mrpVal,
      discountPrice: priceVal,
      image: images[0]?.image_url || '/placeholder-tee.jpg',
      slug: product.slug,
      size: selectedSize,
      quantity,
      maxStock: stockLimit || 10,
    });

    analytics.trackAddToCart(product.id, product.name, selectedSize, priceVal);

    setTimeout(() => {
      setAdding(false);
      if (redirectToCheck) {
        analytics.trackCheckoutStarted(1, priceVal);
        router.push('/checkout');
      } else {
        const event = new CustomEvent('open-cart');
        window.dispatchEvent(event);
      }
    }, 450);
  };

  const sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="space-y-12 select-none font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Left Side: Product Images Viewer */}
        <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
          {/* Thumbnails list (Desktop - Left Side) */}
          <div className="order-2 md:order-1 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-3 flex-shrink-0 md:w-20">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIdx(i)}
                className={`relative aspect-3/4 w-16 md:w-full bg-stone-50 flex-shrink-0 border transition-all ${
                  activeImageIdx === i ? 'border-stone-900' : 'border-stone-200/40 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={`${product.name} look ${i + 1}`}
                  className="object-cover w-full h-full absolute inset-0"
                />
              </button>
            ))}
          </div>

          {/* Primary Zoom Display */}
          <div className="order-1 md:order-2 flex-grow relative bg-transparent overflow-hidden rounded-none">
            <ImageZoom src={primaryImage} alt={product.name} />
            
            {/* Wishlist Heart Toggle */}
            <button
              onClick={handleWishlistClick}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-[#faf9f6]/95 backdrop-blur-xs text-stone-900 shadow-luxury hover:bg-white transition-colors"
            >
              <Heart
                className={`h-4.5 w-4.5 stroke-[1.5] ${
                  isFavorited ? 'fill-sale text-sale' : 'text-stone-700'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right Side: Product Details buy panel */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-6 lg:py-2">
          <div className="space-y-1.5">
            <span className="text-[9px] text-stone-400 font-semibold tracking-[0.3em] block">
              ARVIIK SIGNATURE
            </span>
            <h1 className="font-serif font-light text-2xl md:text-3.5xl tracking-wide text-stone-900 uppercase">
              {product.name}
            </h1>
          </div>

          {/* Multi-Price Listing */}
          <div className="flex items-center space-x-3 pb-5 border-b border-stone-200/20 font-sans">
            <span className="text-lg font-semibold text-stone-900">
              {formatPrice(priceVal)}
            </span>
            {mrpVal > priceVal && (
              <>
                <span className="text-xs text-stone-400 line-through">
                  {formatPrice(mrpVal)}
                </span>
                <span className="text-[10px] text-sale font-medium tracking-[0.1em] uppercase">
                  ({discountVal}% OFF)
                </span>
              </>
            )}
          </div>

          {/* Short info description */}
          <p className="text-xs text-stone-500 leading-relaxed font-light font-sans tracking-wide">
            {product.description}
          </p>

          {/* Size selection row */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="font-semibold uppercase tracking-[0.15em] text-[10px] text-stone-850">
                Choose Size
              </span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-secondary hover:text-stone-950 cursor-pointer underline tracking-[0.15em] text-[10px] font-semibold flex items-center space-x-1"
              >
                <span>Size Guide / Chart</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
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
                    className={`border font-semibold text-[11px] w-11 h-11 flex items-center justify-center transition-colors uppercase rounded-none font-sans ${
                      selectedSize === size
                        ? 'bg-stone-900 text-white border-stone-900'
                        : !isAvailable
                        ? 'border-stone-100 text-stone-300 cursor-not-allowed line-through bg-stone-50/50'
                        : 'border-stone-200 text-stone-600 hover:border-stone-900'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Size alerts & stocks warnings */}
            {sizeWarning && (
              <p className="text-[10px] text-sale font-semibold uppercase tracking-[0.15em] font-sans">
                Please select a size to proceed.
              </p>
            )}

            {selectedSize && activeSizeStock > 0 && activeSizeStock <= 5 && (
              <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-[0.15em] font-sans">
                Running Low! Only {activeSizeStock} left.
              </p>
            )}
            
            {selectedSize && activeSizeStock === 0 && (
              <p className="text-[10px] text-sale font-semibold uppercase tracking-[0.15em] font-sans">
                {selectedSize} is SOLD OUT.
              </p>
            )}
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={adding}
              className="flex-grow bg-stone-900 text-white text-[10px] font-semibold tracking-[0.25em] py-4 hover:bg-stone-800 transition-all duration-300 rounded-none flex items-center justify-center space-x-2 border border-stone-900"
            >
              <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
              <span>{adding ? 'RESERVING...' : 'ADD TO BAG'}</span>
            </button>
            
            <button
              onClick={() => handleAddToCart(true)}
              disabled={adding}
              className="flex-grow bg-transparent border border-stone-300 text-stone-900 text-[10px] font-semibold tracking-[0.25em] py-4 hover:border-stone-900 transition-all rounded-none font-sans"
            >
              BUY IT NOW
            </button>
          </div>

          {/* Luxury Collapsible Accordions (Replaces specs table and trust icons) */}
          <div className="border-t border-stone-200/20 pt-4 space-y-4">
            {/* Accordion 1: Specs */}
            <div className="border-b border-stone-200/20 pb-4">
              <button
                onClick={() => toggleAccordion('specs')}
                className="w-full flex justify-between items-center text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-900 py-1"
              >
                <span>PRODUCT SPECIFICATIONS</span>
                <ChevronRight className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-300 ${activeAccordion === 'specs' ? 'rotate-90' : ''}`} />
              </button>
              <div className={`luxury-accordion-content ${activeAccordion === 'specs' ? 'open' : ''}`}>
                <div className="pt-3.5 pb-1.5 text-[10px] text-stone-500 leading-relaxed font-sans space-y-2 uppercase tracking-[0.08em]">
                  <div className="flex justify-between">
                    <span className="text-stone-400">FABRIC WEAVE:</span>
                    <span className="font-semibold text-stone-800">{product.fabric}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">THREAD WEIGHT:</span>
                    <span className="font-semibold text-stone-800">{product.gsm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">FIT STYLE:</span>
                    <span className="font-semibold text-stone-800">{product.fit_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">WASH CARE:</span>
                    <span className="font-semibold text-stone-800">MACHINE COLD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 2: Care */}
            <div className="border-b border-stone-200/20 pb-4">
              <button
                onClick={() => toggleAccordion('care')}
                className="w-full flex justify-between items-center text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-900 py-1"
              >
                <span>CARE & WASH INSTRUCTIONS</span>
                <ChevronRight className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-300 ${activeAccordion === 'care' ? 'rotate-90' : ''}`} />
              </button>
              <div className={`luxury-accordion-content ${activeAccordion === 'care' ? 'open' : ''}`}>
                <div className="pt-3.5 pb-1.5 text-[11px] text-stone-500 leading-relaxed space-y-1.5 font-sans font-light tracking-wide">
                  <p>· Machine wash cold with similar colors inside out.</p>
                  <p>· Do not bleach or use heavy enzymatic detergents.</p>
                  <p>· Dry flat in shade. Do not tumble dry.</p>
                  <p>· Warm iron on reverse side. Do not iron directly on prints.</p>
                </div>
              </div>
            </div>

            {/* Accordion 3: Shipping */}
            <div className="border-b border-stone-200/20 pb-4">
              <button
                onClick={() => toggleAccordion('shipping')}
                className="w-full flex justify-between items-center text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-900 py-1"
              >
                <span>SHIPPING & RETURNS</span>
                <ChevronRight className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-300 ${activeAccordion === 'shipping' ? 'rotate-90' : ''}`} />
              </button>
              <div className={`luxury-accordion-content ${activeAccordion === 'shipping' ? 'open' : ''}`}>
                <div className="pt-3.5 pb-1.5 text-[11px] text-stone-500 leading-relaxed space-y-1.5 font-sans font-light tracking-wide">
                  <p>· Free standard shipping on all prepaid orders across India.</p>
                  <p>· Dispatch within 24-48 hours. Delivery takes 3-5 business days.</p>
                  <p>· Cash on Delivery (COD) is available (additional charges apply).</p>
                  <p>· 7-day hassle-free returns and size exchanges from delivery date.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic Recommendation Engine Strip */}
      <ProductRecommendation currentProduct={product as any} />

      {/* Review list */}
      <Review />

      {/* Size recommendation guides modal */}
      <SizeGuide isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      {/* Mobile Sticky CTA footer (rests cleanly at bottom-0 since bottom nav bar is removed) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 py-3.5 px-4 z-40 flex space-x-3.5 shadow-luxury pb-safe">
        <button
          onClick={() => handleAddToCart(false)}
          className="flex-1 bg-white border border-stone-900 text-stone-900 text-[9px] font-semibold tracking-[0.2em] py-3.5 rounded-none uppercase font-sans"
        >
          ADD TO BAG
        </button>
        <button
          onClick={() => handleAddToCart(true)}
          className="flex-1 bg-stone-900 text-white text-[9px] font-semibold tracking-[0.2em] py-3.5 rounded-none uppercase font-sans"
        >
          BUY NOW
        </button>
      </div>
    </div>
  );
}
