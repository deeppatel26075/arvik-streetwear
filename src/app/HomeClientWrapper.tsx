'use client';

import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { ArrowRight, Star } from 'lucide-react';

interface HomeClientWrapperProps {
  products: any[];
  settings?: any;
}

export default function HomeClientWrapper({ products }: HomeClientWrapperProps) {
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
      {/* 1. HERO SECTION */}
      <section className="relative h-[60vh] sm:h-[68vh] min-h-[420px] w-full flex items-center justify-center bg-stone-900 overflow-hidden select-none">
        <div className="absolute inset-0 z-0">
          <img
            src="/products/mard-paisa-maroon.jpg"
            alt="ARVIIK Streetwear Hero"
            className="object-cover w-full h-full opacity-40 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/30 to-stone-950/70" />
        </div>

        <div className="relative z-10 text-center text-white px-4 space-y-5 max-w-4xl mx-auto">
          <p className="text-[10px] sm:text-xs font-extrabold tracking-[0.35em] uppercase text-lime-400 bg-stone-950/70 inline-block px-3.5 py-1 rounded-full border border-stone-800 backdrop-blur-xs">
            ARVIIK CLOTHING LAB
          </p>
          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-[0.08em] uppercase leading-tight text-white drop-shadow-md">
            WEAR YOUR<br />
            <span className="text-stone-100">IDENTITY</span>
          </h1>
          <p className="text-xs sm:text-sm tracking-widest text-stone-300 max-w-md mx-auto leading-relaxed font-medium">
            Heavyweight fabrics. Bold printed oversized silhouettes. Premium local craftsmanship.
          </p>
          <div className="pt-4">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-3 bg-white text-stone-950 font-extrabold uppercase text-xs tracking-[0.2em] px-8 py-3.5 hover:bg-stone-950 hover:text-white border border-transparent hover:border-white transition-all duration-300 rounded-xs shadow-lg"
            >
              <span>Shop Collection</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Curated Collections
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-900 mt-0.5">
              Shop By Category
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <Link
            href="/shop?category=Limited+Edition"
            className="group relative h-52 sm:h-60 bg-stone-950 rounded-xs overflow-hidden p-5 flex flex-col justify-between border border-stone-800 transition-all hover:scale-[1.02] duration-300 shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent z-10" />
            <img
              src="/products/farebi-olive.jpg"
              alt="Limited Edition"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity duration-300"
            />
            <div className="relative z-20 flex justify-between items-start">
              <span className="bg-amber-400 text-stone-950 text-[9px] font-extrabold uppercase px-2.5 py-1 tracking-widest rounded-full shadow-xs">
                🔥 Exclusive
              </span>
            </div>
            <div className="relative z-20 space-y-1">
              <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white group-hover:text-amber-400 transition-colors">
                Limited Edition
              </h3>
              <p className="text-[10px] text-stone-300 font-medium tracking-wide flex items-center justify-between">
                <span>Rare numbered drops</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>

          <Link
            href="/shop?category=On+Fire"
            className="group relative h-52 sm:h-60 bg-stone-950 rounded-xs overflow-hidden p-5 flex flex-col justify-between border border-stone-800 transition-all hover:scale-[1.02] duration-300 shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent z-10" />
            <img
              src="/products/polarize-cream.jpg"
              alt="On Fire"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity duration-300"
            />
            <div className="relative z-20 flex justify-between items-start">
              <span className="bg-orange-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 tracking-widest rounded-full shadow-xs">
                ⚡ Hot Drop
              </span>
            </div>
            <div className="relative z-20 space-y-1">
              <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white group-hover:text-orange-400 transition-colors">
                On Fire
              </h3>
              <p className="text-[10px] text-stone-300 font-medium tracking-wide flex items-center justify-between">
                <span>Trending silhouettes</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>

          <Link
            href="/shop?category=Graphic+Tee"
            className="group relative h-52 sm:h-60 bg-stone-950 rounded-xs overflow-hidden p-5 flex flex-col justify-between border border-stone-800 transition-all hover:scale-[1.02] duration-300 shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent z-10" />
            <img
              src="/products/polarize-navy.jpg"
              alt="Graphic Tee"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity duration-300"
            />
            <div className="relative z-20 flex justify-between items-start">
              <span className="bg-indigo-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 tracking-widest rounded-full shadow-xs">
                🎨 Canvas Art
              </span>
            </div>
            <div className="relative z-20 space-y-1">
              <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white group-hover:text-indigo-300 transition-colors">
                Graphic Tee
              </h3>
              <p className="text-[10px] text-stone-300 font-medium tracking-wide flex items-center justify-between">
                <span>Heavyweight prints</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>

          <Link
            href="/shop?category=Psychology+Edition"
            className="group relative h-52 sm:h-60 bg-stone-950 rounded-xs overflow-hidden p-5 flex flex-col justify-between border border-stone-800 transition-all hover:scale-[1.02] duration-300 shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent z-10" />
            <img
              src="/products/mard-paisa-maroon.jpg"
              alt="Psychology Edition"
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity duration-300"
            />
            <div className="relative z-20 flex justify-between items-start">
              <span className="bg-emerald-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 tracking-widest rounded-full shadow-xs">
                🧠 Mindset
              </span>
            </div>
            <div className="relative z-20 space-y-1">
              <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white group-hover:text-emerald-400 transition-colors">
                Psychology Edition
              </h3>
              <p className="text-[10px] text-stone-300 font-medium tracking-wide flex items-center justify-between">
                <span>Concept driven apparel</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </p>
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

      {/* 4. THE FOUNDERS SECTION */}
      <section id="founders" className="bg-stone-950 text-white py-14 sm:py-18 border-t border-b border-stone-900">
        <div id="story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Single Unified Box */}
          <div className="max-w-4xl mx-auto bg-stone-900/80 border border-stone-800 p-6 sm:p-10 rounded-xs shadow-2xl space-y-8 hover:border-lime-400/40 transition-all duration-300">
            {/* Box Header */}
            <div className="text-center space-y-2 border-b border-stone-800 pb-6">
              <span className="text-[10px] text-lime-400 font-extrabold tracking-[0.35em] uppercase">
                Leadership & Vision
              </span>
              <h2 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-white">
                THE FOUNDERS
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide leading-relaxed max-w-xl mx-auto">
                ARVIIK was built from the collective vision to engineer heavyweight luxury streetwear, bold printed silhouettes, and uncompromised local craftsmanship.
              </p>
            </div>

            {/* Three Founders Mentioned Inside The Single Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-stone-800">
              
              {/* Founder 1 */}
              <div className="space-y-1.5 pt-3 md:pt-0 md:px-4">
                <span className="inline-block text-[9px] font-extrabold tracking-widest text-lime-400 uppercase bg-stone-950 px-3 py-0.5 rounded-full border border-stone-800">
                  Co-Founder
                </span>
                <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white">
                  RISHI PATEL
                </h3>
              </div>

              {/* Founder 2 */}
              <div className="space-y-1.5 pt-4 md:pt-0 md:px-4">
                <span className="inline-block text-[9px] font-extrabold tracking-widest text-lime-400 uppercase bg-stone-950 px-3 py-0.5 rounded-full border border-stone-800">
                  Co-Founder
                </span>
                <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white">
                  KEYUR VAGELA
                </h3>
              </div>

              {/* Founder 3 */}
              <div className="space-y-1.5 pt-4 md:pt-0 md:px-4">
                <span className="inline-block text-[9px] font-extrabold tracking-widest text-lime-400 uppercase bg-stone-950 px-3 py-0.5 rounded-full border border-stone-800">
                  Co-Founder
                </span>
                <h3 className="font-syne font-extrabold text-lg uppercase tracking-wider text-white">
                  ARYAN PATEL
                </h3>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 5. COMMUNITY REVIEWS SECTION */}
      <section className="bg-stone-50 py-12 sm:py-16 border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              Verifiable Feedback
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-900">
              Community Reviews
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xs border border-stone-200/60 shadow-xs flex flex-col space-y-3.5">
              <div className="flex items-center text-amber-500 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "The print quality is unmatched. Most oversized tees lose shape around the neck after three washes, but ARVIIK feels as heavy and boxy as day one."
              </p>
              <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                <span className="text-stone-900">Karan Malhotra</span>
                <span>Mumbai</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xs border border-stone-200/60 shadow-xs flex flex-col space-y-3.5">
              <div className="flex items-center text-amber-500 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "Bought the Archive-01 tee. Absolutely in love with the French Terry fabric weight. Shipping was fast, and the size chart is completely accurate."
              </p>
              <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                <span className="text-stone-900">Elena Rostova</span>
                <span>Delhi</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xs border border-stone-200/60 shadow-xs flex flex-col space-y-3.5">
              <div className="flex items-center text-amber-500 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "Super premium packaging and customer service helped me switch size from XL to L because the fit is extremely boxy. Highly recommended!"
              </p>
              <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                <span className="text-stone-900">Rohan Sharma</span>
                <span>Bengaluru</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
