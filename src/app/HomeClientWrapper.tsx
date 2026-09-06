'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Star, Flame, Shirt, Truck, Wallet, Tag, Percent, Gift, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

// Maps the icon name stored in the `hero_slides` table (edited from the
// admin panel) back to the lucide component actually rendered.
const HERO_ICON_MAP: Record<string, any> = { Flame, Shirt, Truck, Wallet, Star, Tag, Percent, Gift };

const COLOR_FILTERS = [
  { name: 'Olive Green', hex: '#3f6212' },
  { name: 'Vintage Cream', hex: '#fafaf9', border: true },
  { name: 'Burgundy Maroon', hex: '#881337' },
  { name: 'Midnight Navy', hex: '#1e3a5f' },
];

const HERO_SLIDES = [
  {
    badge: 'Limited Offer',
    icon: Flame,
    titleMain: 'Buy 2 Get',
    titleHighlight: '10% Off',
    subtitle: 'Limited Time Offer',
    image: '/products/polarize-navy.jpg',
  },
  {
    badge: 'Bundle Deal',
    icon: Shirt,
    titleMain: 'Buy 3 Tees At',
    titleHighlight: '₹1199',
    subtitle: 'Use Code: B31199',
    image: '/products/farebi-olive.jpg',
  },
  {
    badge: 'Pan-India',
    icon: Truck,
    titleMain: 'Free',
    titleHighlight: 'Shipping',
    subtitle: 'Across India · Orders Above ₹1499',
    image: '/products/mard-paisa-maroon.jpg',
  },
  {
    badge: 'Prepaid Perk',
    icon: Wallet,
    titleMain: '10% Off',
    titleHighlight: 'Prepaid',
    subtitle: 'Pay Online & Save',
    image: '/products/polarize-cream.jpg',
  },
];

interface HomeClientWrapperProps {
  products: any[];
  heroSlides?: any[];
  settings?: any;
}

const REVIEWS = [
  {
    quote: '"The print quality is unmatched. Most oversized tees lose shape around the neck after three washes, but ARVIIK feels as heavy and boxy as day one."',
    author: 'Karan Malhotra',
    location: 'Mumbai',
    rating: 5,
  },
  {
    quote: '"Bought the Archive-01 tee. Absolutely in love with the French Terry fabric weight. Shipping was fast, and the size chart is completely accurate."',
    author: 'Elena Rostova',
    location: 'Delhi',
    rating: 5,
  },
  {
    quote: '"Super premium packaging and customer service helped me switch size from XL to L because the fit is extremely boxy. Highly recommended!"',
    author: 'Rohan Sharma',
    location: 'Bengaluru',
    rating: 5,
  },
];

export default function HomeClientWrapper({ products, heroSlides }: HomeClientWrapperProps) {
  const [currentReview, setCurrentReview] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  // Auto-swipe every 2.5 seconds for faster transition
  React.useEffect(() => {
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

  // Touch Swipe handlers for mobile
  const minSwipeDistance = 30;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextReview();
    } else if (isRightSwipe) {
      handlePrevReview();
    }
  };

  // Promo hero banner slider — auto-swipe + manual (arrows, dots, touch).
  // Slides come from the admin-editable `hero_slides` table when present;
  // hiding every slide there empties this list and the section disappears
  // rather than silently falling back to the hardcoded defaults below.
  const slides = React.useMemo(() => {
    if (!heroSlides || heroSlides.length === 0) return HERO_SLIDES;
    return heroSlides
      .filter((s) => !s.is_hidden)
      .map((s) => ({
        badge: s.badge,
        icon: HERO_ICON_MAP[s.icon] || Flame,
        titleMain: s.title_main,
        titleHighlight: s.title_highlight,
        subtitle: s.subtitle,
        image: s.image_url,
      }));
  }, [heroSlides]);

  const [bannerIndex, setBannerIndex] = React.useState(0);
  const [bannerTouchStart, setBannerTouchStart] = React.useState<number | null>(null);
  const [bannerTouchEnd, setBannerTouchEnd] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrevBanner = () => {
    setBannerIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextBanner = () => {
    setBannerIndex((prev) => (prev + 1) % slides.length);
  };

  const minBannerSwipeDistance = 30;

  const onBannerTouchStart = (e: React.TouchEvent) => {
    setBannerTouchEnd(null);
    setBannerTouchStart(e.targetTouches[0].clientX);
  };

  const onBannerTouchMove = (e: React.TouchEvent) => {
    setBannerTouchEnd(e.targetTouches[0].clientX);
  };

  const onBannerTouchEnd = () => {
    if (!bannerTouchStart || !bannerTouchEnd) return;
    const distance = bannerTouchStart - bannerTouchEnd;
    const isLeftSwipe = distance > minBannerSwipeDistance;
    const isRightSwipe = distance < -minBannerSwipeDistance;
    if (isLeftSwipe) {
      handleNextBanner();
    } else if (isRightSwipe) {
      handlePrevBanner();
    }
  };

  const displayProducts = products || [];

  const activeSlide = slides[bannerIndex % (slides.length || 1)];
  const ActiveSlideIcon = activeSlide?.icon;

  return (
    <div className="w-full space-y-10 sm:space-y-14">
      {/* PROMO OFFER BANNER — hidden entirely when admin has hidden every slide */}
      {activeSlide && (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <Link
          href="/shop"
          className="group block relative overflow-hidden rounded-lg bg-stone-950 border border-stone-800/60 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center min-h-[170px] sm:min-h-[185px] lg:min-h-[200px]">
            {/* Left Content — text swaps in sync with the image on each slide */}
            <div className="flex-1 p-5 sm:p-8 lg:p-10 space-y-3 sm:space-y-4 relative z-10">
              <div key={bannerIndex} className="space-y-2.5 sm:space-y-3 animate-fade-in">
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full pl-1.5 pr-3 py-1">
                  <span className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full bg-lime-400 flex items-center justify-center flex-shrink-0">
                    <ActiveSlideIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-stone-950" />
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.15em] text-white">
                    {activeSlide.badge}
                  </span>
                </div>
                <h2 className="font-bebas text-xl sm:text-3xl lg:text-4xl uppercase tracking-wide text-white leading-[1.05] line-clamp-2">
                  {activeSlide.titleMain}{' '}
                  <span className="text-lime-400">{activeSlide.titleHighlight}</span>
                </h2>
                <p className="text-[10px] sm:text-xs font-semibold text-stone-400 tracking-wide">
                  {activeSlide.subtitle}
                </p>
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center space-x-2 bg-white text-stone-950 font-extrabold uppercase text-[10px] sm:text-xs tracking-[0.2em] px-5 sm:px-7 py-2.5 sm:py-3 rounded-xs group-hover:bg-lime-400 group-hover:text-stone-950 transition-all duration-300 shadow-md">
                  <span>SHOP NOW</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>

            {/* Right Product Image — swaps with the left content on each slide */}
            <div
              onTouchStart={onBannerTouchStart}
              onTouchMove={onBannerTouchMove}
              onTouchEnd={onBannerTouchEnd}
              className="relative w-[160px] sm:w-[280px] lg:w-[380px] h-[170px] sm:h-[185px] lg:h-[200px] flex-shrink-0 overflow-hidden select-none touch-pan-y"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10 pointer-events-none" />
              <Image
                key={bannerIndex}
                src={activeSlide.image}
                alt={activeSlide.badge}
                fill
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 280px, 380px"
                className="object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500 animate-fade-in"
              />

              {/* Manual Arrows */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrevBanner();
                }}
                className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 items-center justify-center h-6 w-6 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNextBanner();
                }}
                className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 items-center justify-center h-6 w-6 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBannerIndex(index);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === bannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to photo ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Link>
      </section>
      )}

      {/* 2. CATEGORIES SECTION — compact editorial collection grid */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-0">
        {/* Inner wrapper narrower than the hero banner above, so this section
            tapers inward from the banner's edges (a deliberate "pyramid" look)
            instead of sharing the exact same left/right bounds. */}
        <div className="md:max-w-[1200px] md:mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Curated Collections
            </span>
            <h2 className="font-syne font-extrabold text-lg sm:text-xl uppercase tracking-wider text-stone-900 mt-2">
              Shop By Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase tracking-widest text-stone-900 hover:opacity-70 transition-opacity"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-5 xl:gap-6 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            href="/shop?category=Limited+Edition"
            className="group flex-shrink-0 w-[150px] sm:w-[160px] md:w-auto bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative h-[150px] sm:h-[175px] md:h-[200px] xl:h-[215px] bg-stone-100 overflow-hidden">
              <Image
                src="/products/farebi-olive.jpg"
                alt="Limited Edition"
                fill
                sizes="(max-width: 767px) 170px, (max-width: 1279px) 50vw, 25vw"
                loading="lazy"
                className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <div className="p-2.5 sm:p-3 border-t border-stone-100">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-amber-600 block mb-0.5">Exclusive</span>
              <h3 className="font-syne font-extrabold text-[10px] sm:text-sm uppercase tracking-tight text-stone-950 leading-tight">
                Limited Edition
              </h3>
            </div>
          </Link>

          <Link
            href="/shop?category=On+Fire"
            className="group flex-shrink-0 w-[150px] sm:w-[160px] md:w-auto bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative h-[150px] sm:h-[175px] md:h-[200px] xl:h-[215px] bg-stone-100 overflow-hidden">
              <Image
                src="/products/5bd3dfaf3ac84a85a18925e9d3989206.jpg"
                alt="On Fire"
                fill
                sizes="(max-width: 767px) 170px, (max-width: 1279px) 50vw, 25vw"
                loading="lazy"
                className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <div className="p-2.5 sm:p-3 border-t border-stone-100">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-orange-600 block mb-0.5">Hot Drop</span>
              <h3 className="font-syne font-extrabold text-[10px] sm:text-sm uppercase tracking-tight text-stone-950 leading-tight">
                On Fire
              </h3>
            </div>
          </Link>

          <Link
            href="/shop?category=Psychology+Edition"
            className="group flex-shrink-0 w-[150px] sm:w-[160px] md:w-auto bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="relative h-[150px] sm:h-[175px] md:h-[200px] xl:h-[215px] bg-stone-100 overflow-hidden">
              <Image
                src="/products/mard-paisa-maroon.jpg"
                alt="Hidden Patterns"
                fill
                sizes="(max-width: 767px) 170px, (max-width: 1279px) 50vw, 25vw"
                loading="lazy"
                className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <div className="p-2.5 sm:p-3 border-t border-stone-100">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-emerald-600 block mb-0.5">Mindset</span>
              <h3 className="font-syne font-extrabold text-[10px] sm:text-sm uppercase tracking-tight text-stone-950 leading-tight">
                Hidden Patterns
              </h3>
            </div>
          </Link>
        </div>
        </div>
      </section>

      {/* 3. NEW DROPS SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Summer Release 01
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-900 mt-0.5">
              New Drops
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-1.5 text-xs font-extrabold uppercase tracking-widest text-stone-900 hover:opacity-75 transition-opacity mt-3 sm:mt-0"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. FILTER BY COLOR SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-stone-700" />
            <h2 className="font-syne font-extrabold text-sm sm:text-base uppercase tracking-wider text-stone-900">
              Filter By Color
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_FILTERS.map((c) => (
              <Link
                key={c.name}
                href={`/shop?color=${encodeURIComponent(c.name)}`}
                className="inline-flex items-center gap-2 bg-white border border-stone-200/80 hover:border-stone-900 rounded-full pl-2 pr-4 py-2 transition-colors"
              >
                <span
                  className={`h-5 w-5 rounded-full flex-shrink-0 ${c.border ? 'border border-stone-300' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-xs font-bold text-stone-800">{c.name}</span>
              </Link>
            ))}
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 border border-stone-200/80 hover:border-stone-900 rounded-full px-4 py-2 text-xs font-bold text-stone-800 transition-colors"
            >
              + More
            </Link>
          </div>
        </div>
      </section>

      {/* 5. COMMUNITY REVIEWS SECTION - SINGLE CARD CAROUSEL */}
      <section className="bg-stone-50 py-12 sm:py-16 border-b border-stone-200/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Verifiable Feedback
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-900">
              Community Reviews
            </h2>
          </div>

          {/* Single Box Review Card with Touch Swipe Support */}
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative bg-white p-6 sm:p-8 rounded-xl border border-stone-200/80 shadow-md flex flex-col items-center text-center space-y-4 select-none touch-pan-y"
          >
            {/* Left Chevron Button */}
            <button
              onClick={handlePrevReview}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-100 hover:bg-stone-950 hover:text-white text-stone-700 transition-colors shadow-xs z-10"
              aria-label="Previous Review"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Right Chevron Button */}
            <button
              onClick={handleNextReview}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-100 hover:bg-stone-950 hover:text-white text-stone-700 transition-colors shadow-xs z-10"
              aria-label="Next Review"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Animated Content Wrapper */}
            <div key={currentReview} className="animate-fade-in flex flex-col items-center space-y-4 w-full">
              {/* Stars */}
              <div className="flex items-center text-amber-500 space-x-1">
                {[...Array(REVIEWS[currentReview].rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              {/* Review Content */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic max-w-xl px-6 sm:px-8">
                {REVIEWS[currentReview].quote}
              </p>

              {/* Author Info */}
              <div className="pt-2 border-t border-stone-100 w-full flex justify-center items-center space-x-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-stone-400">
                <span className="text-stone-950">{REVIEWS[currentReview].author}</span>
                <span>•</span>
                <span className="text-stone-500">{REVIEWS[currentReview].location}</span>
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              {REVIEWS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentReview
                      ? 'w-6 bg-stone-950'
                      : 'w-2 bg-stone-300 hover:bg-stone-500'
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
