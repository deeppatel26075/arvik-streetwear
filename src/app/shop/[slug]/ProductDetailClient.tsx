'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, WishlistItem } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import PanoramicCurveCarousel from '@/components/PanoramicCurveCarousel';
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
    category?: { name: string } | string;
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
  style,
  onLoad,
}: {
  src: string;
  fallbackIndex?: number;
  alt: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
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
      style={style}
      onError={() => setErrored(true)}
      onLoad={onLoad}
    />
  );
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { setThemePreset } = useTheme();

  const rawCategoryName = typeof product.category === 'string' ? product.category : product.category?.name;
  // "Psychology Edition" is the real category name in the database — shown
  // to customers as "Hidden Patterns" everywhere, matching the shop listing.
  const categoryName = rawCategoryName?.toLowerCase() === 'psychology edition' ? 'Hidden Patterns' : rawCategoryName;

  // Psychology Edition (like On Fire) only repaints the shop listing tab.
  // Individual product pages always stay on the default theme.
  useEffect(() => {
    setThemePreset('chaos');
  }, [setThemePreset]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL' | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [wobble, setWobble] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  // Two separate interaction models: desktop (mouse) clicks to zoom in,
  // centered on the click point, with the origin then following the
  // cursor while zoomed; touch pinches to zoom with a translate+scale pan.
  // isDesktopView tracks real input capability (fine pointer + hover), not
  // just viewport width, so a touchscreen laptop still gets pinch.
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [zoomInteracting, setZoomInteracting] = useState(false);
  const pinchStateRef = useRef<{ dist: number; scale: number } | null>(null);
  const panStateRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  // The frame's pixel box is computed in JS from the photo's real aspect
  // ratio once it loads, so it hugs the photo exactly (no letterboxed
  // empty space) — CSS aspect-ratio auto-sizing doesn't help here since
  // this box's only child is an absolutely-positioned `fill` image, which
  // contributes no intrinsic size for the box to size itself against.
  const [zoomBoxSize, setZoomBoxSize] = useState<{ w: number; h: number } | null>(null);
  const zoomSlotRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktopView(mql.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDesktopView(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
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

  // Product Story panels for the curved carousel — cycles this product's
  // own photos through a set of craft/story beats.
  const STORY_CAPTIONS = [
    'Heavyweight 240 GSM cotton, brushed for softness.',
    'Signature boxy, oversized silhouette — cut to drop.',
    'High-density graphic print, laid down screen by screen.',
    'Garment-washed for a lived-in, vintage finish.',
    'Reinforced double-stitched hems, built for the long run.',
  ];
  const storyPanels = images.map((img, i) => ({
    id: `story-${i}`,
    image: img.image_url,
    caption: STORY_CAPTIONS[i % STORY_CAPTIONS.length],
  }));

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
      setWobble(false);
      requestAnimationFrame(() => setWobble(true));
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

  // Pinch-to-zoom + drag-to-pan for the zoom modal. Scale/pan are applied
  // as a single `translate(...) scale(...)` transform with a fixed center
  // origin, so pinching and dragging compose naturally.
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 3;

  const clampPan = (px: number, py: number, scale: number, box: { width: number; height: number }) => {
    const maxX = (box.width * (scale - 1)) / 2;
    const maxY = (box.height * (scale - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, px)),
      y: Math.max(-maxY, Math.min(maxY, py)),
    };
  };

  const touchDistance = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const handleZoomTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      setZoomInteracting(true);
      pinchStateRef.current = { dist: touchDistance(e.touches), scale: zoomScale };
    } else if (e.touches.length === 1 && zoomScale > 1) {
      setZoomInteracting(true);
      panStateRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: zoomPan.x, panY: zoomPan.y };
    }
  };

  const handleZoomTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 2 && pinchStateRef.current) {
      e.preventDefault();
      const nextScale = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, pinchStateRef.current.scale * (touchDistance(e.touches) / pinchStateRef.current.dist))
      );
      setZoomScale(nextScale);
      setZoomPan((p) => clampPan(p.x, p.y, nextScale, rect));
    } else if (e.touches.length === 1 && panStateRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panStateRef.current.x;
      const dy = e.touches[0].clientY - panStateRef.current.y;
      setZoomPan(clampPan(panStateRef.current.panX + dx, panStateRef.current.panY + dy, zoomScale, rect));
    }
  };

  const handleZoomTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchStateRef.current = null;
    if (e.touches.length === 0) {
      panStateRef.current = null;
      setZoomInteracting(false);
      if (zoomScale <= ZOOM_MIN + 0.02) {
        setZoomScale(ZOOM_MIN);
        setZoomPan({ x: 0, y: 0 });
      }
    }
  };

  // Desktop: click zooms in centered on the click point (click again to
  // zoom back out); while zoomed, the origin follows the cursor so moving
  // the mouse pans around the photo without needing to click-drag.
  const handleZoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopView) return;
    if (zoomScale > 1) {
      setZoomScale(1);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    setZoomScale(2.2);
  };

  const handleZoomHoverMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopView || zoomScale <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const closeZoomModal = () => {
    setShowZoomModal(false);
    setZoomScale(1);
    setZoomOrigin({ x: 50, y: 50 });
    setZoomPan({ x: 0, y: 0 });
    setZoomBoxSize(null);
  };

  const handleZoomImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget;
    if (!t.naturalWidth || !t.naturalHeight) return;
    const aspect = t.naturalWidth / t.naturalHeight;
    const availW = zoomSlotRef.current?.clientWidth || window.innerWidth * 0.85;
    const isSmUp = window.innerWidth >= 640;
    const maxH = window.innerHeight * (isSmUp ? 0.82 : 0.74);
    let w = availW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    setZoomBoxSize({ w, h });
  };

  return (
    <>
      <div className="relative z-10 space-y-6 sm:space-y-12">
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
                <div
                  key={i}
                  onClick={() => setShowZoomModal(true)}
                  className="relative flex-shrink-0 w-full h-full snap-center cursor-pointer"
                >
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
                {categoryName || 'Oversized Streetwear'}
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
                <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                  Select Size <span className="text-red-500">*</span>:
                </span>
                {selectedSize && (
                  <span className="text-xs text-stone-950 font-extrabold uppercase bg-stone-100 px-2 py-0.5 rounded-md">{selectedSize}</span>
                )}
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
              onAnimationEnd={() => setWobble(false)}
              disabled={adding}
              className={`w-full bg-stone-950 hover:bg-stone-900 text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer group ${
                wobble ? 'animate-wobble' : ''
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{adding ? 'Adding To Bag...' : 'ADD TO BAG'}</span>
            </button>

            <button
              onClick={() => handleAddToCart(true)}
              onAnimationEnd={() => setWobble(false)}
              disabled={adding}
              className={`w-full bg-white border-2 border-stone-950 text-stone-950 hover:bg-stone-950 hover:text-white text-xs font-extrabold uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
                wobble ? 'animate-wobble' : ''
              }`}
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

      {/* Product Story Section — full-bleed curved panoramic carousel,
          breaking out of the page's own side padding (via matching
          negative margins) so it reads as an immersive dark band instead
          of being boxed in like the rest of this light-themed page. */}
      <div className="pt-12 border-t border-stone-200 space-y-8">
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <PanoramicCurveCarousel
            panels={storyPanels}
            eyebrow="The Craft & Concept"
            heading="Product Story"
            ctaLabel=""
            autoplay={false}
            filmStrip
          />
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

      {/* Image Zoom Modal — opens showing the photo fully framed. Pinch
          with two fingers to zoom (drag with one finger to pan once
          zoomed); on desktop, scroll/trackpad-pinch to zoom and click-drag
          to pan. */}
      {showZoomModal && (
        <div
          onClick={closeZoomModal}
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 border border-stone-800 rounded-lg shadow-2xl overflow-hidden flex flex-col items-center p-3 sm:p-6"
          >
            <button
              onClick={closeZoomModal}
              className="absolute top-4 right-4 z-50 bg-stone-800 text-white p-2 rounded-full hover:bg-stone-700 transition-colors"
              aria-label="Close zoom"
            >
              <X className="h-5 w-5" />
            </button>
            <div ref={zoomSlotRef} className="w-full flex justify-center">
              <div
                onClick={handleZoomClick}
                onMouseMove={handleZoomHoverMove}
                onTouchStart={handleZoomTouchStart}
                onTouchMove={handleZoomTouchMove}
                onTouchEnd={handleZoomTouchEnd}
                data-zoom-interactive="true"
                className="relative rounded-md overflow-hidden bg-stone-950 touch-none select-none"
                style={{
                  width: zoomBoxSize ? `${zoomBoxSize.w}px` : '100%',
                  height: zoomBoxSize ? `${zoomBoxSize.h}px` : '70vh',
                  cursor: isDesktopView ? (zoomScale > 1 ? 'zoom-out' : 'zoom-in') : 'default',
                }}
              >
                <SafeImage
                  src={primaryImage}
                  fallbackIndex={activeImageIdx}
                  alt="Zoomed product preview"
                  fill
                  className={`object-contain ${zoomInteracting ? '' : 'transition-transform duration-300 ease-out'}`}
                  style={
                    isDesktopView
                      ? { transform: `scale(${zoomScale})`, transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                      : { transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`, transformOrigin: '50% 50%' }
                  }
                  onLoad={handleZoomImageLoad}
                />
                {/* Hint sits over the photo instead of adding a caption row
                    below it, so the frame hugs the photo with no leftover
                    space and stays evenly padded on every side. */}
                {zoomScale <= 1 && (
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full pointer-events-none">
                    {isDesktopView ? 'Click to zoom' : 'Pinch to zoom'}
                  </span>
                )}
              </div>
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
    </>
  );
}
