'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Star, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeClientWrapperProps {
  products: any[];
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

export default function HomeClientWrapper({ products }: HomeClientWrapperProps) {
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

  const displayProducts = products && products.length > 0 ? products : [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Eternal Vision',
      slug: 'eternal-vision-black-tee',
      category: 'Oversized Tees',
      price: 1299,
      mrp: 1299,
      discount_price: 1299,
      product_images: [{ image_url: '/products/farebi-olive.jpg' }]
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Chaos Bloom',
      slug: 'chaos-bloom-ivory-tee',
      category: 'Oversized Tees',
      price: 1199,
      mrp: 1199,
      discount_price: 1199,
      product_images: [{ image_url: '/products/polarize-cream.jpg' }]
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Midnight Tales',
      slug: 'midnight-tales-black-tee',
      category: 'Graphic Prints',
      price: 1299,
      mrp: 1299,
      discount_price: 1299,
      product_images: [{ image_url: '/products/polarize-navy.jpg' }]
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Lost Paradise',
      slug: 'lost-paradise-black-tee',
      category: 'Graphic Prints',
      price: 1299,
      mrp: 1299,
      discount_price: 1299,
      product_images: [{ image_url: '/products/mard-paisa-maroon.jpg' }]
    }
  ];

  return (
    <div className="w-full space-y-10 sm:space-y-14">
      {/* PROMO OFFER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <Link
          href="/shop"
          className="group block relative overflow-hidden rounded-lg bg-stone-950 border border-stone-800/60 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <div className="flex items-center">
            {/* Left Content */}
            <div className="flex-1 p-5 sm:p-8 lg:p-10 space-y-3 sm:space-y-4 relative z-10">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 fill-orange-500 animate-pulse" />
                <span className="font-syne font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-wide text-white uppercase">
                  BUY 2 GET 10% OFF
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
                Limited Time Offer
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center space-x-2 bg-white text-stone-950 font-extrabold uppercase text-[10px] sm:text-xs tracking-[0.2em] px-5 sm:px-7 py-2.5 sm:py-3 rounded-xs group-hover:bg-lime-400 group-hover:text-stone-950 transition-all duration-300 shadow-md">
                  <span>SHOP NOW</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>

            {/* Right Product Image */}
            <div className="relative w-[140px] sm:w-[200px] lg:w-[260px] h-[160px] sm:h-[200px] lg:h-[220px] flex-shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/60 to-transparent z-10" />
              <Image
                src="/products/polarize-navy.jpg"
                alt="ARVIIK Offer Product"
                fill
                sizes="(max-width: 640px) 140px, (max-width: 1024px) 200px, 260px"
                className="object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </Link>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Curated Collections
            </span>
            <h2 className="font-syne font-extrabold text-lg sm:text-xl uppercase tracking-wider text-stone-900 mt-0.5">
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

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <Link
            href="/shop?category=Limited+Edition"
            className="group relative flex-shrink-0 w-[140px] sm:w-auto sm:flex-1 h-24 sm:h-28 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 transition-all hover:scale-[1.03] duration-300 shadow-md"
          >
            <Image
              src="/products/farebi-olive.jpg"
              alt="Limited Edition"
              fill
              sizes="(max-width: 640px) 160px, 25vw"
              loading="lazy"
              className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400">🔥 Exclusive</span>
              <h3 className="font-syne font-extrabold text-xs uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors leading-tight">
                Limited Edition
              </h3>
            </div>
          </Link>

          <Link
            href="/shop?category=On+Fire"
            className="group relative flex-shrink-0 w-[140px] sm:w-auto sm:flex-1 h-24 sm:h-28 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 transition-all hover:scale-[1.03] duration-300 shadow-md"
          >
            <Image
              src="/products/polarize-cream.jpg"
              alt="On Fire"
              fill
              sizes="(max-width: 640px) 160px, 25vw"
              loading="lazy"
              className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <span className="text-[8px] font-bold uppercase tracking-widest text-orange-400">⚡ Hot Drop</span>
              <h3 className="font-syne font-extrabold text-xs uppercase tracking-wider text-white group-hover:text-orange-400 transition-colors leading-tight">
                On Fire
              </h3>
            </div>
          </Link>

          <Link
            href="/shop?category=Graphic+Tee"
            className="group relative flex-shrink-0 w-[140px] sm:w-auto sm:flex-1 h-24 sm:h-28 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 transition-all hover:scale-[1.03] duration-300 shadow-md"
          >
            <Image
              src="/products/polarize-navy.jpg"
              alt="Graphic Tee"
              fill
              sizes="(max-width: 640px) 160px, 25vw"
              loading="lazy"
              className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">🎨 Canvas Art</span>
              <h3 className="font-syne font-extrabold text-xs uppercase tracking-wider text-white group-hover:text-indigo-300 transition-colors leading-tight">
                Graphic Tee
              </h3>
            </div>
          </Link>

          <Link
            href="/shop?category=Psychology+Edition"
            className="group relative flex-shrink-0 w-[140px] sm:w-auto sm:flex-1 h-24 sm:h-28 bg-stone-950 rounded-lg overflow-hidden border border-stone-800 transition-all hover:scale-[1.03] duration-300 shadow-md"
          >
            <Image
              src="/products/mard-paisa-maroon.jpg"
              alt="Psychology Edition"
              fill
              sizes="(max-width: 640px) 160px, 25vw"
              loading="lazy"
              className="object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">🧠 Mindset</span>
              <h3 className="font-syne font-extrabold text-xs uppercase tracking-wider text-white group-hover:text-emerald-400 transition-colors leading-tight">
                Psychology Edition
              </h3>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. NEW DROPS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
