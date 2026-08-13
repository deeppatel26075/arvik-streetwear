'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, WishlistItem } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import {
  Heart,
  ShoppingBag,
  Star,
  ArrowLeft,
  ArrowRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Ruler,
  ZoomIn,
  Share2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Check,
  Zap,
  Calculator,
} from 'lucide-react';

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
    fabric?: string;
    gsm?: string;
    fit_type?: string;
    wash_instructions?: string;
    description?: string;
    category?: { name: string };
    product_images?: ProductImage[];
    inventory?: InventoryItem[];
  };
}

const REVIEWS = [
  { quote: 'Fabric quality is insane for the price. Fits exactly as oversized as promised.', author: 'Aryan K.', location: 'Mumbai', rating: 5 },
  { quote: 'Print quality held up after multiple washes. Definitely ordering more colorways.', author: 'Priya M.', location: 'Delhi', rating: 5 },
  { quote: 'Great streetwear piece, sizing runs a bit large so consider sizing down.', author: 'Rohan D.', location: 'Bengaluru', rating: 4 },
  { quote: 'Best 240 GSM tee I own. Packaging and delivery were also on point.', author: 'Simran K.', location: 'Pune', rating: 5 },
];

// Real local product photos used as a graceful fallback whenever a
// product's own image URL (e.g. from the database) fails to load.
const FALLBACK_PHOTOS = [
  '/products/farebi-olive.jpg',
  '/products/polarize-navy.jpg',
  '/products/mard-paisa-maroon.jpg',
  '/products/polarize-cream.jpg',
];

function SafeImage({
  src,
  fallbackIndex = 0,
  alt,
  fill,
  className,
  priority,
  sizes,
}: {
  src: string;
  fallbackIndex?: number;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = errored
    ? FALLBACK_PHOTOS[((fallbackIndex % FALLBACK_PHOTOS.length) + FALLBACK_PHOTOS.length) % FALLBACK_PHOTOS.length]
    : src;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
      onError={() => setErrored(true)}
    />
  );
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('M');
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSmartCalculator, setShowSmartCalculator] = useState(false);
  const [userHeight, setUserHeight] = useState('175');
  const [userWeight, setUserWeight] = useState('70');
  const [fitPreference, setFitPreference] = useState<'oversized' | 'regular'>('oversized');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion states
  const [openAccordion, setOpenAccordion] = useState<'description' | 'specs' | 'wash' | 'shipping' | null>('specs');

  // Customer Reviews single-card carousel state
  const [currentReview, setCurrentReview] = useState(0);
  const [reviewTouchStart, setReviewTouchStart] = useState<number | null>(null);
  const [reviewTouchEnd, setReviewTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % REVIEWS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handlePrevReview = () => {
    setCurrentReview((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const handleNextReview = () => {
    setCurrentReview((prev) => (prev + 1) % REVIEWS.length);
  };

  const minReviewSwipeDistance = 30;

  const onReviewTouchStart = (e: React.TouchEvent) => {
    setReviewTouchEnd(null);
    setReviewTouchStart(e.targetTouches[0].clientX);
  };

  const onReviewTouchMove = (e: React.TouchEvent) => {
    setReviewTouchEnd(e.targetTouches[0].clientX);
  };

  const onReviewTouchEnd = () => {
    if (!reviewTouchStart || !reviewTouchEnd) return;
    const distance = reviewTouchStart - reviewTouchEnd;
    if (distance > minReviewSwipeDistance) {
      handleNextReview();
    } else if (distance < -minReviewSwipeDistance) {
      handlePrevReview();
    }
  };

  const storyScrollRef = useRef<HTMLDivElement>(null);
  const scrollStory = (direction: 1 | -1) => {
    const el = storyScrollRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth || el.clientWidth) + 16;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  // Main product image carousel — swipeable, synced with the thumbnail strip
  const mainImageScrollRef = useRef<HTMLDivElement>(null);
  const isMainImageScrollingProgrammatically = useRef(false);

  const scrollMainImageTo = (idx: number) => {
    const el = mainImageScrollRef.current;
    if (!el) return;
    isMainImageScrollingProgrammatically.current = true;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
    setActiveImageIdx(idx);
    setTimeout(() => {
      isMainImageScrollingProgrammatically.current = false;
    }, 500);
  };

  const scrollMainImageBy = (direction: 1 | -1) => {
    const total = images.length;
    const next = Math.max(0, Math.min(total - 1, activeImageIdx + direction));
    scrollMainImageTo(next);
  };

  const handleMainImageScroll = () => {
    if (isMainImageScrollingProgrammatically.current) return;
    const el = mainImageScrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeImageIdx) setActiveImageIdx(idx);
  };

  const images = product.product_images && product.product_images.length > 0
    ? product.product_images
    : [{ image_url: '/placeholder-tee.jpg' }];

  const primaryImage = images[activeImageIdx]?.image_url || images[0]?.image_url || '/placeholder-tee.jpg';

  const activePrice = product.discount_price && product.discount_price > 0
    ? product.discount_price
    : product.price;

  useEffect(() => {
    try {
      const currentItem = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: activePrice,
        image: images[0]?.image_url || '/placeholder-tee.jpg',
      };

      const stored = localStorage.getItem('arviik_recently_viewed');
      let list = stored ? JSON.parse(stored) : [];
      list = list.filter((i: any) => i.id !== product.id);
      list.unshift(currentItem);
      localStorage.setItem('arviik_recently_viewed', JSON.stringify(list.slice(0, 8)));
    } catch (e) {
      console.error('Failed saving to recently viewed:', e);
    }
  }, [product.id, activePrice, images]);

  const calculateSize = () => {
    const w = parseFloat(userWeight) || 68;
    let recommendedSize: 'S' | 'M' | 'L' | 'XL' | 'XXL' = 'M';
    if (w < 58) recommendedSize = 'S';
    else if (w >= 58 && w < 72) recommendedSize = 'M';
    else if (w >= 72 && w < 84) recommendedSize = 'L';
    else if (w >= 84 && w < 96) recommendedSize = 'XL';
    else recommendedSize = 'XXL';

    if (fitPreference === 'regular' && recommendedSize !== 'S') {
      const map: any = { M: 'S', L: 'M', XL: 'L', XXL: 'XL' };
      recommendedSize = map[recommendedSize] || recommendedSize;
    }

    setCalcResult(recommendedSize);
    setSelectedSize(recommendedSize);
  };

  const isDiscounted = product.discount_price !== undefined && product.discount_price !== null && product.discount_price > 0;
  const isFavorited = isInWishlist(product.id);

  const sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL', 'XXL'];

  const getStock = (size: 'S' | 'M' | 'L' | 'XL' | 'XXL') => {
    if (!product.inventory || product.inventory.length === 0) return 10;
    const item = product.inventory.find(i => i.size === size);
    return item ? item.quantity : 0;
  };

  const selectedStock = selectedSize ? getStock(selectedSize) : 10;

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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleTab = (tab: 'description' | 'specs' | 'wash' | 'shipping') => {
    setOpenAccordion(openAccordion === tab ? null : tab);
  };

  return (
    <div className="space-y-6 sm:space-y-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex justify-between items-center pb-3 border-b border-stone-200">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs font-bold text-stone-600 hover:text-stone-950 uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Back to Shop</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center space-x-1 text-[11px] sm:text-xs text-stone-500 hover:text-stone-950 font-bold uppercase tracking-wider transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Product Layout (Comet-Inspired 2-Column Showcase) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
        
        {/* Left Column: Image Gallery Showcase (Comet Style) */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4 lg:sticky lg:top-24">
          {/* Main Display Image — swipeable carousel */}
          <div className="relative aspect-4/5 sm:aspect-3/4 bg-stone-100 rounded-2xl overflow-hidden border border-stone-200/80 group shadow-sm">
            <div
              ref={mainImageScrollRef}
              onScroll={handleMainImageScroll}
              className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth touch-pan-x"
            >
              {images.map((img, i) => (
                <div key={i} className="relative flex-shrink-0 w-full h-full snap-center">
                  <SafeImage
                    src={img.image_url}
                    fallbackIndex={i}
                    alt={i === 0 ? product.name : `${product.name} look ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={() => scrollMainImageBy(-1)}
                  disabled={activeImageIdx === 0}
                  aria-label="Previous photo"
                  className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-stone-200 shadow-md hover:bg-white transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4 text-stone-900" />
                </button>
                <button
                  onClick={() => scrollMainImageBy(1)}
                  disabled={activeImageIdx === images.length - 1}
                  aria-label="Next photo"
                  className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-stone-200 shadow-md hover:bg-white transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4 text-stone-900" />
                </button>
              </>
            )}

            {/* Badges & Image Pill Counter */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
              {isDiscounted && (
                <span className="bg-stone-950 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">
                  SAVE ₹{product.price - activePrice}
                </span>
              )}
              <span className="bg-white/90 backdrop-blur-md text-stone-900 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border border-stone-200/80 shadow-xs">
                {activeImageIdx + 1} / {images.length}
              </span>
            </div>

            {/* Actions over main image */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col space-y-2">
              <button
                onClick={handleWishlistClick}
                className="p-2.5 rounded-full bg-white/95 backdrop-blur-md text-stone-900 shadow-md hover:bg-white transition-all border border-stone-200"
                title="Save to Wishlist"
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    isFavorited ? 'fill-red-600 text-red-600' : 'text-stone-700'
                  }`}
                />
              </button>
              <button
                onClick={() => setShowZoomModal(true)}
                className="p-2.5 rounded-full bg-white/95 backdrop-blur-md text-stone-900 shadow-md hover:bg-white transition-all border border-stone-200"
                title="Zoom Photo"
              >
                <ZoomIn className="h-4 w-4 text-stone-700" />
              </button>
            </div>
          </div>

          {/* Horizontal Thumbnails Strip (Comet Style) */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2.5">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => scrollMainImageTo(i)}
                  className={`relative aspect-4/5 sm:aspect-3/4 bg-stone-100 rounded-xl overflow-hidden transition-all border ${
                    activeImageIdx === i
                      ? 'border-stone-950 ring-2 ring-stone-950 shadow-sm opacity-100'
                      : 'border-stone-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={img.image_url}
                    fallbackIndex={i}
                    alt={`${product.name} look ${i + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Controls (Comet Inspired) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Header & Title */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200/80">
                {product.category?.name || 'Oversized Streetwear'}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                In Stock
              </span>
            </div>
            
            <h1 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950 leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars Pill */}
            <div className="flex items-center space-x-2 pt-0.5">
              <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-amber-900">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-xs font-bold font-mono">4.9</span>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">• 148 Verified Street Culture Reviews</span>
            </div>
          </div>

          {/* Price Block (Comet Style) */}
          <div className="p-4 bg-stone-50/80 border border-stone-200/80 rounded-xl space-y-1">
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-mono">
                {formatPrice(activePrice)}
              </span>
              {isDiscounted && (
                <span className="text-sm text-stone-400 line-through font-mono">
                  {formatPrice(product.price)}
                </span>
              )}
              {isDiscounted && (
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-md">
                  {Math.round(((product.price - activePrice) / product.price) * 100)}% OFF
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-500 font-medium">
              Inclusive of all taxes. Free shipping on all prepaid orders.
            </p>
          </div>

          {/* Size Selector Grid (Comet Style) */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">Select Size:</span>
                <span className="text-xs text-stone-950 font-extrabold uppercase bg-stone-100 px-2 py-0.5 rounded-md">{selectedSize || 'Choose'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSmartCalculator(true)}
                  className="inline-flex items-center space-x-1 text-[11px] text-stone-900 hover:text-stone-600 font-extrabold uppercase tracking-wider underline underline-offset-4"
                >
                  <Calculator className="h-3.5 w-3.5 text-lime-700" />
                  <span>Find Size</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center space-x-1 text-[11px] text-stone-600 hover:text-stone-950 font-bold uppercase tracking-wider underline underline-offset-4"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {sizes.map((sz) => {
                const stock = getStock(sz);
                const isAvailable = stock > 0;
                return (
                  <button
                    key={sz}
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedSize(sz);
                      setSizeWarning(false);
                    }}
                    className={`h-11 sm:h-12 font-bold text-xs rounded-xl flex flex-col items-center justify-center transition-all uppercase border ${
                      selectedSize === sz
                        ? 'bg-stone-950 text-white border-stone-950 shadow-md ring-2 ring-stone-950'
                        : !isAvailable
                        ? 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed line-through'
                        : 'border-stone-200 text-stone-900 hover:border-stone-950 hover:bg-stone-50'
                    }`}
                  >
                    <span>{sz}</span>
                    {isAvailable && stock <= 3 && (
                      <span className={`text-[7px] sm:text-[8px] tracking-tighter uppercase font-extrabold ${selectedSize === sz ? 'text-amber-300' : 'text-amber-600'}`}>
                        {stock} Left
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {sizeWarning && (
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider animate-bounce">
                ⚠️ Please select a size before adding to bag.
              </p>
            )}
          </div>

          {/* Action CTA Buttons (Comet Style) */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={adding}
              className="w-full bg-stone-950 hover:bg-stone-900 text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{adding ? 'Adding To Bag...' : 'ADD TO BAG'}</span>
            </button>

            <button
              onClick={() => handleAddToCart(true)}
              disabled={adding}
              className="w-full bg-white border-2 border-stone-950 text-stone-950 hover:bg-stone-950 hover:text-white text-xs font-extrabold uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>BUY IT NOW (EXPRESS CHECKOUT)</span>
            </button>
          </div>

          {/* Delivery & Assurance Perks Banner (Comet Minimal Badges) */}
          <div className="grid grid-cols-3 gap-2 p-3.5 bg-stone-50/80 border border-stone-200/80 rounded-xl text-center">
            <div className="space-y-1">
              <Truck className="h-4 w-4 text-stone-800 mx-auto" />
              <span className="text-[10px] font-extrabold text-stone-900 uppercase tracking-wider block">Express Shipping</span>
              <span className="text-[9px] text-stone-500 block">Dispatch in 24 hrs</span>
            </div>
            <div className="space-y-1 border-x border-stone-200 px-1">
              <RotateCcw className="h-4 w-4 text-stone-800 mx-auto" />
              <span className="text-[10px] font-extrabold text-stone-900 uppercase tracking-wider block">7-Day Exchange</span>
              <span className="text-[9px] text-stone-500 block">Hassle-Free Pickup</span>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="h-4 w-4 text-stone-800 mx-auto" />
              <span className="text-[10px] font-extrabold text-stone-900 uppercase tracking-wider block">100% Authentic</span>
              <span className="text-[9px] text-stone-500 block">240 GSM French Terry</span>
            </div>
          </div>

          {/* Product Details Accordion Tabs */}
          <div className="border-t border-stone-200 pt-4 space-y-2.5">
            {/* Specs Tab */}
            <div className="border border-stone-200/80 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTab('specs')}
                className="w-full p-4 bg-white hover:bg-stone-50 flex justify-between items-center text-xs font-bold text-stone-900 uppercase tracking-wider"
              >
                <span>Fabric & Fit Specifications</span>
                {openAccordion === 'specs' ? <ChevronUp className="h-4 w-4 text-stone-600" /> : <ChevronDown className="h-4 w-4 text-stone-600" />}
              </button>
              {openAccordion === 'specs' && (
                <div className="p-4 bg-stone-50/50 border-t border-stone-100 text-xs space-y-2 text-stone-700 font-medium">
                  <p><strong className="font-semibold text-stone-900">Material:</strong> {product.fabric || '100% Premium Combed Cotton'}</p>
                  <p><strong className="font-semibold text-stone-900">Fabric Weight:</strong> {product.gsm || '240 GSM Heavyweight'}</p>
                  <p><strong className="font-semibold text-stone-900">Fit Silhouette:</strong> {product.fit_type || 'Signature Oversized Drop-Shoulder Fit'}</p>
                  <p><strong className="font-semibold text-stone-900">Finish:</strong> Bio-washed, Pre-shrunk & Softened</p>
                </div>
              )}
            </div>

            {/* Wash Care Tab */}
            <div className="border border-stone-200/80 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleTab('wash')}
                className="w-full p-4 bg-white hover:bg-stone-50 flex justify-between items-center text-xs font-bold text-stone-900 uppercase tracking-wider"
              >
                <span>Wash & Care Instructions</span>
                {openAccordion === 'wash' ? <ChevronUp className="h-4 w-4 text-stone-600" /> : <ChevronDown className="h-4 w-4 text-stone-600" />}
              </button>
              {openAccordion === 'wash' && (
                <div className="p-4 bg-stone-50/50 border-t border-stone-100 text-xs space-y-1.5 text-stone-700 font-medium">
                  <p>• {product.wash_instructions || 'Machine wash cold inside out with like colors.'}</p>
                  <p>• Do not iron directly on screen-printed graphic art.</p>
                  <p>• Do not tumble dry high; hang dry in shade to maintain fabric longevity.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Product Story Section */}
      <div className="pt-12 border-t border-stone-200 space-y-6">
        {/* 3 Story Images Carousel */}
        <div className="relative group/carousel">
          <div
            ref={storyScrollRef}
            className="flex gap-4 overflow-x-auto pt-2 pb-1 snap-x snap-mandatory scroll-smooth scrollbar-hide"
          >
            {[
              {
                src: images[0]?.image_url || '/products/farebi-olive.jpg',
                alt: 'Product Detail 1',
                caption: 'Heavyweight 240 GSM Cotton',
              },
              {
                src: images[1]?.image_url || images[0]?.image_url || '/products/polarize-cream.jpg',
                alt: 'Product Detail 2',
                caption: 'Signature Boxy Oversized Fit',
              },
              {
                src: images[2]?.image_url || images[0]?.image_url || '/products/polarize-navy.jpg',
                alt: 'Product Detail 3',
                caption: 'High-Density Graphic Craft',
              },
            ].map((slide, idx) => (
              <div
                key={slide.alt}
                className="relative flex-shrink-0 w-[92%] sm:w-[80%] md:w-[65%] lg:w-[55%] snap-center aspect-4/5 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs group"
              >
                <SafeImage
                  src={slide.src}
                  fallbackIndex={idx}
                  alt={slide.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest block text-stone-200">
                    {slide.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollStory(-1)}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 border border-stone-200 shadow-md hover:bg-white active:scale-95 transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-stone-900" />
          </button>
          <button
            type="button"
            onClick={() => scrollStory(1)}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 border border-stone-200 shadow-md hover:bg-white active:scale-95 transition-all"
          >
            <ChevronRight className="h-4 w-4 text-stone-900" />
          </button>
        </div>

        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
            The Craft & Concept
          </span>
          <h3 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-900">
            Product Story
          </h3>
        </div>

        {/* Product Story Image Collage */}
        <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
          <div className="relative row-span-2 aspect-3/4 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
            <SafeImage
              src={images[0]?.image_url || '/products/farebi-olive.jpg'}
              fallbackIndex={0}
              alt="Product story collage 1"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
            <SafeImage
              src={images[1]?.image_url || images[0]?.image_url || '/products/polarize-cream.jpg'}
              fallbackIndex={1}
              alt="Product story collage 2"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
            <SafeImage
              src={images[2]?.image_url || images[0]?.image_url || '/products/polarize-navy.jpg'}
              fallbackIndex={2}
              alt="Product story collage 3"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            {product.description ||
              `Every piece in the ARVIIK collection is born from a desire to merge luxury street aesthetics with raw, uncompromised quality. Engineered with heavy 240 GSM combed cotton, custom boxy cuts, and bold concept artwork, this shirt is designed to be worn as a statement of identity.`}
          </p>
        </div>
      </div>

      {/* 4. Recommended Products Section */}
      <div className="pt-12 border-t border-stone-200 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b border-stone-200 pb-4">
          <div className="min-w-0">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Complete Your Fit
            </span>
            <h3 className="font-syne font-extrabold text-lg sm:text-xl uppercase tracking-wide sm:tracking-wider text-stone-900 mt-0.5">
              Recommended Products
            </h3>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-widest text-stone-900 hover:opacity-75 transition-opacity flex-shrink-0"
          >
            <span>Explore All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {[
            {
              id: 'rec-001',
              name: 'Eternal Vision Tee',
              slug: 'eternal-vision-black-tee',
              price: 1299,
              mrp: 1299,
              category: 'Oversized Tees',
              product_images: [{ image_url: '/products/farebi-olive.jpg' }]
            },
            {
              id: 'rec-002',
              name: 'Chaos Bloom Tee',
              slug: 'chaos-bloom-ivory-tee',
              price: 1199,
              mrp: 1199,
              category: 'Oversized Tees',
              product_images: [{ image_url: '/products/polarize-cream.jpg' }]
            },
            {
              id: 'rec-003',
              name: 'Midnight Tales Tee',
              slug: 'midnight-tales-black-tee',
              price: 1299,
              mrp: 1299,
              category: 'Graphic Prints',
              product_images: [{ image_url: '/products/polarize-navy.jpg' }]
            },
            {
              id: 'rec-004',
              name: 'Lost Paradise Tee',
              slug: 'lost-paradise-black-tee',
              price: 1299,
              mrp: 1299,
              category: 'Graphic Prints',
              product_images: [{ image_url: '/products/mard-paisa-maroon.jpg' }]
            }
          ]
            .filter((item) => item.slug !== product.slug)
            .slice(0, 4)
            .map((item) => (
              <ProductCard key={item.id} product={item as any} />
            ))}
        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <div className="pt-12 border-t border-stone-200 space-y-6">
        <div className="border-b border-stone-200 pb-4">
          <h3 className="font-syne font-extrabold text-xl uppercase tracking-wider text-stone-900">
            Customer Reviews & Ratings
          </h3>
          <p className="text-xs text-stone-500 font-light mt-0.5">Verified feedback from street culture enthusiasts across India.</p>
        </div>

        {/* Rating Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 p-5 bg-stone-50/60 border border-stone-200/80 rounded-xl">
          <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 sm:border-r sm:border-stone-200 sm:pr-10">
            <span className="text-4xl font-extrabold text-stone-950 font-mono">4.9</span>
            <div className="space-y-1">
              <div className="text-amber-500 flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider block">Based on 128 reviews</span>
            </div>
          </div>

          <div className="space-y-1.5 self-center">
            {[
              { star: 5, pct: 88 },
              { star: 4, pct: 8 },
              { star: 3, pct: 3 },
              { star: 2, pct: 1 },
              { star: 1, pct: 0 },
            ].map((row) => (
              <div key={row.star} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-stone-600 w-8 shrink-0">{row.star} ★</span>
                <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="text-[10px] font-semibold text-stone-500 w-8 shrink-0 text-right">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Reviews — Single Box Review Card with Touch Swipe Support */}
        <div
          onTouchStart={onReviewTouchStart}
          onTouchMove={onReviewTouchMove}
          onTouchEnd={onReviewTouchEnd}
          className="relative bg-white p-6 sm:p-8 rounded-xl border border-stone-200/80 shadow-md flex flex-col items-center text-center space-y-4 select-none touch-pan-y"
        >
          <button
            onClick={handlePrevReview}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-100 hover:bg-stone-950 hover:text-white text-stone-700 transition-colors shadow-xs z-10"
            aria-label="Previous Review"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleNextReview}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-100 hover:bg-stone-950 hover:text-white text-stone-700 transition-colors shadow-xs z-10"
            aria-label="Next Review"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div key={currentReview} className="animate-fade-in flex flex-col items-center space-y-4 w-full">
            <div className="flex items-center text-amber-500 space-x-1">
              {[...Array(REVIEWS[currentReview].rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic max-w-xl px-6 sm:px-8">
              &quot;{REVIEWS[currentReview].quote}&quot;
            </p>

            <div className="pt-2 border-t border-stone-100 w-full flex justify-center items-center space-x-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400">
              <span className="text-stone-950">{REVIEWS[currentReview].author}</span>
              <span>•</span>
              <span className="text-stone-500">{REVIEWS[currentReview].location}</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 pt-2">
            {REVIEWS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentReview ? 'w-6 bg-stone-950' : 'w-2 bg-stone-300 hover:bg-stone-500'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {showZoomModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 border border-stone-800 rounded-sm overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute top-4 right-4 z-50 bg-stone-800 text-white p-2 rounded-full hover:bg-stone-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full h-[80vh]">
              <SafeImage
                src={primaryImage}
                fallbackIndex={activeImageIdx}
                alt="Zoomed product preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-xs max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-900 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                <span>ARVIIK Size Measurement Guide</span>
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="text-stone-400 hover:text-stone-900 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              All ARVIIK streetwear products are tailored in a signature oversized boxy fit. Order your normal size for an oversized look, or size down for a standard regular fit.
            </p>

            <table className="w-full text-left text-xs border border-stone-200">
              <thead>
                <tr className="bg-stone-100 text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-2.5 border-b border-r border-stone-200">Size</th>
                  <th className="p-2.5 border-b border-r border-stone-200">Chest (Inches)</th>
                  <th className="p-2.5 border-b border-r border-stone-200">Length (Inches)</th>
                  <th className="p-2.5 border-b border-stone-200">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-700">
                <tr><td className="p-2.5 border-r font-bold text-stone-900">S</td><td className="p-2.5 border-r">42"</td><td className="p-2.5 border-r">28"</td><td className="p-2.5">21"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">M</td><td className="p-2.5 border-r">44"</td><td className="p-2.5 border-r">29"</td><td className="p-2.5">22"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">L</td><td className="p-2.5 border-r">46"</td><td className="p-2.5 border-r">30"</td><td className="p-2.5">23"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">XL</td><td className="p-2.5 border-r">48"</td><td className="p-2.5 border-r">31"</td><td className="p-2.5">24"</td></tr>
                <tr><td className="p-2.5 border-r font-bold text-stone-900">XXL</td><td className="p-2.5 border-r">50"</td><td className="p-2.5 border-r">32"</td><td className="p-2.5">25"</td></tr>
              </tbody>
            </table>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full bg-stone-950 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xs"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Smart Size Calculator Modal */}
      {showSmartCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs select-none">
          <div className="bg-white border border-stone-200 w-full max-w-md p-6 rounded-xs shadow-2xl relative space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-stone-950" />
                <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-stone-900">
                  Smart Size Recommender
                </h3>
              </div>
              <button
                onClick={() => setShowSmartCalculator(false)}
                className="text-stone-400 hover:text-stone-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 font-medium">
              Enter your weight & height to calculate your ideal ARVIIK streetwear fit.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-600 block">Height (cm)</label>
                  <input
                    type="number"
                    value={userHeight}
                    onChange={(e) => setUserHeight(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 p-2.5 text-xs text-stone-900 focus:outline-none rounded-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-600 block">Weight (kg)</label>
                  <input
                    type="number"
                    value={userWeight}
                    onChange={(e) => setUserWeight(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 p-2.5 text-xs text-stone-900 focus:outline-none rounded-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-600 block">Fit Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFitPreference('oversized')}
                    className={`p-2 text-xs font-bold uppercase rounded-xs border ${
                      fitPreference === 'oversized' ? 'bg-stone-950 text-white border-stone-950' : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    Oversized Boxy
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitPreference('regular')}
                    className={`p-2 text-xs font-bold uppercase rounded-xs border ${
                      fitPreference === 'regular' ? 'bg-stone-950 text-white border-stone-950' : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    Standard Regular
                  </button>
                </div>
              </div>

              <button
                onClick={calculateSize}
                className="w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs uppercase tracking-widest py-3 rounded-xs transition-all"
              >
                Calculate My Size
              </button>

              {calcResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xs text-center space-y-1 animate-fade-in">
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest block">Recommended Fit</span>
                  <span className="text-xl font-syne font-extrabold text-emerald-950">SIZE {calcResult}</span>
                  <p className="text-[10px] text-emerald-700">Size {calcResult} has been automatically selected for you!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
