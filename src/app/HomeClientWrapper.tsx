'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import CategoryStrip from '@/components/Home/CategoryStrip';
import HeroSlider from '@/components/Home/HeroSlider';
import TrustRibbon from '@/components/Home/TrustRibbon';
import RecentlyViewed from '@/components/Commerce/RecentlyViewed';
import { Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomeClientWrapperProps {
  products: any[];
  settings?: any;
}

export default function HomeClientWrapper({ products }: HomeClientWrapperProps) {
  const [displayProducts, setDisplayProducts] = useState<any[]>(products);

  useEffect(() => {
    if (products && products.length > 0) {
      setDisplayProducts(products);
    }
  }, [products]);

  // Filter products for homepage sections
  const bestsellers = displayProducts.filter(p => p.tags?.includes('BESTSELLER') || p.tags?.includes('TRENDING')).slice(0, 4);
  const newArrivals = displayProducts.filter(p => p.tags?.includes('NEW ARRIVAL')).slice(0, 4);
  const trendingNow = displayProducts.slice(2, 6); // Take middle slice for variety

  // If filtered lists are empty, fallback to slice of all products
  const renderBestsellers = bestsellers.length > 0 ? bestsellers : displayProducts.slice(0, 4);
  const renderNewArrivals = newArrivals.length > 0 ? newArrivals : displayProducts.slice(Math.max(0, displayProducts.length - 4));
  const renderTrending = trendingNow.length > 0 ? trendingNow : displayProducts.slice(0, 4);

  const categoriesList = [
    {
      name: 'Oversized Tees',
      img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600',
      href: '/shop'
    },
    {
      name: 'Graphic Prints',
      img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600',
      href: '/shop?category=Graphic+Prints'
    },
    {
      name: 'Minimalist Typo',
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
      href: '/shop?category=Minimalist+Typo'
    }
  ];

  return (
    <div className="w-full space-y-0 bg-white">
      {/* 1. Category Strip */}
      <CategoryStrip />

      {/* 2. Hero Slider */}
      <HeroSlider />

      {/* 3. Trust Ribbon */}
      <TrustRibbon />

      {/* 4. OUR BESTSELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 select-none">
        <div className="text-center">
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            Hot Right Now
          </span>
          <h2 className="font-syne font-black text-2xl uppercase tracking-wider text-stone-900 mt-1">
            Our Bestsellers
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {renderBestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* SEE MORE BESTSELLERS Neon CTA Button */}
        <div className="pt-8 flex justify-center">
          <Link
            href="/shop?tag=BESTSELLER"
            className="w-full max-w-md text-center py-4 bg-accent border border-stone-950 text-stone-950 font-syne font-black text-xs tracking-[0.25em] uppercase rounded-sm shadow-retro-yellow active:scale-98 transition-transform"
          >
            SEE MORE BESTSELLERS
          </Link>
        </div>
      </section>

      {/* 5. NEW ARRIVALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 select-none">
        <div className="text-center">
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            Fresh From Drop
          </span>
          <h2 className="font-syne font-black text-2xl uppercase tracking-wider text-stone-900 mt-1">
            New Arrivals
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {renderNewArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. OVERSIZED COLLECTION promo banner */}
      <section className="w-full bg-stone-950 text-white py-20 px-4 relative overflow-hidden select-none">
        <img
          src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600"
          alt="ARVIIK Promo Look"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-5">
          <span className="text-[10px] text-accent font-bold tracking-[0.4em] uppercase">
            Heavyweight Drop Series
          </span>
          <h2 className="font-syne font-black text-3xl sm:text-5xl uppercase tracking-wider leading-none">
            ENGINEERED OVERSIZED FITS
          </h2>
          <p className="text-xs sm:text-sm font-light text-stone-300 max-w-md tracking-wider leading-relaxed">
            Custom-woven 240 GSM Terry cotton designed to hold shape and survive washes. Drop shoulder loose cut silhouette for absolute streetwear comfort.
          </p>
          <div className="pt-2">
            <Link
              href="/shop?category=Oversized+T-Shirts"
              className="inline-flex items-center space-x-2 bg-white text-stone-950 font-syne font-black text-[10px] sm:text-xs tracking-[0.2em] px-8 py-3.5 rounded-full uppercase hover:bg-stone-200 transition-colors"
            >
              <span>SHOP COLLECTION</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. SHOP BY CATEGORY section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10 select-none">
        <div className="text-center">
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            Narrow Your Fit
          </span>
          <h2 className="font-syne font-black text-2xl uppercase tracking-wider text-stone-900 mt-1">
            Shop By Category
          </h2>
        </div>

        {/* Visual Category Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categoriesList.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="relative aspect-video sm:aspect-square w-full rounded-sm overflow-hidden border border-stone-200 group flex items-end p-6 shadow-2xs hover:shadow-md transition-shadow duration-300"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="relative z-10 w-full flex justify-between items-center text-white">
                <span className="font-syne font-black text-base uppercase tracking-wider">
                  {cat.name}
                </span>
                <span className="text-[9px] font-bold tracking-widest bg-white/10 backdrop-blur-xs border border-white/20 px-3 py-1.5 rounded-full">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. TRENDING NOW SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 select-none">
        <div className="text-center">
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            Street Grails
          </span>
          <h2 className="font-syne font-black text-2xl uppercase tracking-wider text-stone-900 mt-1">
            Trending Now
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {renderTrending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 9. CUSTOMER REVIEWS */}
      <section className="bg-stone-50 py-20 select-none border-y border-stone-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center">
            <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
              What The Crew Says
            </span>
            <h2 className="font-syne font-black text-2xl uppercase tracking-wider text-stone-900 mt-1">
              Community Reviews
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Karan Malhotra',
                city: 'Mumbai',
                text: 'The print quality is unmatched. Most oversized tees lose shape around the neck after three washes, but ARVIIK feels as heavy and boxy as day one.',
                stars: 5,
              },
              {
                name: 'Elena Rostova',
                city: 'Delhi',
                text: 'Bought the Polarize Vintage Cream tee. Absolutely in love with the cotton fabric weight. Shipping was fast, and the size guide recommendation was spot on.',
                stars: 5,
              },
              {
                name: 'Rohan Sharma',
                city: 'Bangalore',
                text: 'Super premium packaging. Fits extremely oversized, giving that authentic street look. Buy 3 deal is really value for money!',
                stars: 5,
              },
            ].map((review, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-sm border border-stone-200 shadow-2xs flex flex-col space-y-4"
              >
                <div className="flex items-center text-amber-500">
                  {[...Array(review.stars)].map((_, starIdx) => (
                    <Star key={starIdx} className="h-4 w-4 fill-current text-current" />
                  ))}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed italic font-light">
                  "{review.text}"
                </p>
                <div className="pt-2.5 border-t border-stone-100 flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                  <span>{review.name}</span>
                  <span>{review.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. INSTAGRAM LOOKS */}
      <section className="py-20 space-y-10 select-none">
        <div className="text-center">
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            #ARVIIKCREW
          </span>
          <h2 className="font-syne font-black text-2xl uppercase tracking-wider text-stone-900 mt-1">
            Instagram Looks
          </h2>
        </div>

        {/* Grid of gallery pictures */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600',
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
            'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600',
            'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600',
            'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600',
            'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600'
          ].map((src, i) => (
            <div key={i} className="relative aspect-square w-full group overflow-hidden bg-stone-100">
              <img
                src={src}
                alt={`Instagram look ${i + 1}`}
                className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-104"
              />
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold tracking-widest uppercase border border-white px-3 py-1.5 rounded-sm">
                  View Look
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. Recently Viewed Slider */}
      <RecentlyViewed />
    </div>
  );
}
