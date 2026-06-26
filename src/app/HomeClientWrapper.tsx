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

export default function HomeClientWrapper({ products, settings }: HomeClientWrapperProps) {
  const [displayProducts, setDisplayProducts] = useState<any[]>(products);
  const [activeSettings, setActiveSettings] = useState<any>(settings || {});

  useEffect(() => {
    if (products && products.length > 0) {
      setDisplayProducts(products);
    }
  }, [products]);

  // Sync settings with localStorage fallback
  useEffect(() => {
    try {
      if (settings && Object.keys(settings).length > 0) {
        setActiveSettings(settings);
        localStorage.setItem('arviik_custom_settings', JSON.stringify(settings));
      } else {
        const storedSettings = localStorage.getItem('arviik_custom_settings');
        if (storedSettings) {
          setActiveSettings(JSON.parse(storedSettings));
        }
      }
    } catch (e) {
      console.error('Failed to load settings in homepage wrapper:', e);
    }
  }, [settings]);

  // Apply body-level background theme styles dynamically
  useEffect(() => {
    const bgConfig = activeSettings?.general_config || { bg_style: 'default', custom_bg_color: '#fafaf9', bg_image_url: '' };
    
    // Cache original body styles
    const originalBg = document.body.style.backgroundColor;
    const originalBgImg = document.body.style.backgroundImage;
    const originalBgSize = document.body.style.backgroundSize;
    const originalBgPos = document.body.style.backgroundPosition;
    const originalBgRepeat = document.body.style.backgroundRepeat;
    const originalBgAttachment = document.body.style.backgroundAttachment;
    const originalColor = document.body.style.color;

    // Apply settings
    if (bgConfig.bg_style === 'white') {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#0c0c0b';
    } else if (bgConfig.bg_style === 'charcoal') {
      document.body.style.backgroundColor = '#0f0f0f';
      document.body.style.color = '#f5f5f4';
    } else if (bgConfig.bg_style === 'sepia') {
      document.body.style.backgroundColor = '#f4efe6';
      document.body.style.color = '#0c0c0b';
    } else if (bgConfig.bg_style === 'custom-color') {
      document.body.style.backgroundColor = bgConfig.custom_bg_color || '#fafaf9';
      
      const isDark = (hex: string) => {
        const c = (hex || '').replace('#', '');
        if (c.length !== 6) return false;
        const rgb = parseInt(c, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luma < 135;
      };

      if (isDark(bgConfig.custom_bg_color)) {
        document.body.style.color = '#f5f5f4';
      } else {
        document.body.style.color = '#0c0c0b';
      }
    } else if (bgConfig.bg_style === 'custom-image' && bgConfig.bg_image_url) {
      document.body.style.backgroundImage = `url(${bgConfig.bg_image_url})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    }

    // Reset styles on clean up
    return () => {
      document.body.style.backgroundColor = originalBg;
      document.body.style.backgroundImage = originalBgImg;
      document.body.style.backgroundSize = originalBgSize;
      document.body.style.backgroundPosition = originalBgPos;
      document.body.style.backgroundRepeat = originalBgRepeat;
      document.body.style.backgroundAttachment = originalBgAttachment;
      document.body.style.color = originalColor;
    };
  }, [activeSettings]);

  // Determine dynamic classes based on background theme config
  const bgStyleVal = activeSettings?.general_config?.bg_style || 'default';
  const customBgColorVal = activeSettings?.general_config?.custom_bg_color || '#fafaf9';
  
  const isDarkCustom = () => {
    if (bgStyleVal !== 'custom-color') return false;
    const c = (customBgColorVal || '').replace('#', '');
    if (c.length !== 6) return false;
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 135;
  };

  const isDarkTheme = bgStyleVal === 'charcoal' || isDarkCustom();
  
  const textClass = isDarkTheme ? 'text-white' : 'text-stone-900';
  const subTextClass = isDarkTheme ? 'text-stone-400' : 'text-stone-500';
  const cardBgClass = isDarkTheme ? 'bg-stone-900 border-stone-850 text-white' : 'bg-white border-stone-200 text-stone-900';
  const sectionBgClass = isDarkTheme ? 'bg-stone-900/40 border-y border-stone-850 py-20 select-none' : 'bg-stone-50 py-20 select-none border-y border-stone-150';

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
    <div 
      className={`w-full space-y-0 ${isDarkTheme ? 'bg-stone-950 text-white' : bgStyleVal === 'sepia' ? 'bg-[#f4efe6]' : bgStyleVal === 'custom-color' ? '' : 'bg-[#faf9f6]'}`}
      style={{ backgroundColor: bgStyleVal === 'custom-color' ? customBgColorVal : undefined }}
    >
      {/* 1. Category Strip */}
      <CategoryStrip />

      {/* 2. Hero Slider */}
      <HeroSlider />

      {/* 3. Trust Ribbon */}
      <TrustRibbon />

      {/* 4. OUR BESTSELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12 select-none">
        <div className="text-center space-y-2">
          <span className={`text-[10px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            Curated Selection
          </span>
          <h2 className={`font-serif font-light text-3xl sm:text-4xl tracking-wide ${textClass} mt-1`}>
            Our Bestsellers
          </h2>
          <div className="w-12 h-[1px] bg-secondary/60 mx-auto mt-4" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          {renderBestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* SEE MORE BESTSELLERS CTA Button */}
        <div className="pt-8 flex justify-center">
          <Link
            href="/shop?tag=BESTSELLER"
            className="w-full max-w-md text-center py-4 bg-stone-900 text-white hover:bg-stone-850 font-sans font-medium text-xs tracking-[0.25em] uppercase rounded-none transition-colors duration-300"
          >
            DISCOVER ALL BESTSELLERS
          </Link>
        </div>
      </section>

      {/* 5. NEW ARRIVALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 select-none border-t border-stone-200/30">
        <div className="text-center space-y-2">
          <span className={`text-[10px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            Fresh Release
          </span>
          <h2 className={`font-serif font-light text-3xl sm:text-4xl tracking-wide ${textClass} mt-1`}>
            New Arrivals
          </h2>
          <div className="w-12 h-[1px] bg-secondary/60 mx-auto mt-4" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          {renderNewArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. OVERSIZED COLLECTION promo banner */}
      <section className="w-full bg-stone-950 text-white py-28 px-4 relative overflow-hidden select-none">
        <img
          src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600"
          alt="ARVIIK Promo Look"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="text-[10px] text-accent font-semibold tracking-[0.4em] uppercase block">
            THE EDITORIAL DROP
          </span>
          <h2 className="font-serif font-light text-4xl sm:text-6xl tracking-wide leading-tight">
            Architectural <br className="sm:hidden" />
            Oversized Fits
          </h2>
          <p className="text-xs sm:text-sm font-light text-stone-300 max-w-md tracking-wider leading-relaxed font-sans">
            Custom-woven 240 GSM Terry cotton designed to hold shape and survive washes. Drop shoulder loose cut silhouette for absolute comfort.
          </p>
          <div className="pt-2">
            <Link
              href="/shop?category=Oversized+T-Shirts"
              className="inline-flex items-center space-x-2.5 bg-white text-stone-900 font-sans font-medium text-xs tracking-[0.25em] px-9 py-4 rounded-none uppercase hover:bg-stone-50 transition-colors duration-300"
            >
              <span>SHOP COLLECTION</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Editorial Promo Grid (2 columns on desktop, 1 on mobile) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Epic Thread */}
          <Link
            href="/shop?category=Graphic+Prints"
            className="group relative aspect-[16/10] sm:aspect-[21/10] w-full rounded-none overflow-hidden border border-stone-200/20 flex items-center p-6 sm:p-12 shadow-luxury bg-stone-950 text-white"
          >
            <img
              src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800"
              alt="Epic Thread Collection"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
            <div className="relative z-10 space-y-3.5 max-w-xs sm:max-w-sm">
              <span className="text-[9px] text-accent font-semibold tracking-[0.3em] uppercase block">
                THE ART OF PRINTING
              </span>
              <h3 className="font-serif font-light text-2xl sm:text-4xl leading-tight tracking-wide">
                Premium Graphics
              </h3>
              <p className="text-[10px] text-stone-300 font-light leading-relaxed tracking-wider hidden sm:block font-sans">
                Premium high-density prints crafted from 240 GSM Terry cotton. Unmatched streetwear aesthetics.
              </p>
              <div className="pt-1.5">
                <span className="inline-block text-[9px] font-sans font-medium uppercase tracking-widest bg-white text-stone-950 px-5 py-2.5 rounded-none group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                  Shop Now
                </span>
              </div>
            </div>
          </Link>

          {/* Card 2: Supreme Edition */}
          <Link
            href="/shop?category=Minimalist+Typo"
            className="group relative aspect-[16/10] sm:aspect-[21/10] w-full rounded-none overflow-hidden border border-stone-200/20 flex items-center p-6 sm:p-12 shadow-luxury bg-stone-900 text-white"
          >
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800"
              alt="Supreme Edition"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />
            <div className="relative z-10 space-y-3.5 max-w-xs sm:max-w-sm">
              <span className="text-[9px] text-accent font-semibold tracking-[0.3em] uppercase block">
                THE ART OF SPEECH
              </span>
              <h3 className="font-serif font-light text-2xl sm:text-4xl leading-tight tracking-wide">
                Minimalist Typo
              </h3>
              <p className="text-[10px] text-stone-300 font-light leading-relaxed tracking-wider hidden sm:block font-sans">
                Clean architectural structures. Minimalist typography and puff print drops.
              </p>
              <div className="pt-1.5">
                <span className="inline-block text-[9px] font-sans font-medium uppercase tracking-widest bg-white text-stone-950 px-5 py-2.5 rounded-none group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                  View Collection
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 7. SHOP BY CATEGORY section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12 select-none border-t border-stone-200/30">
        <div className="text-center space-y-2">
          <span className={`text-[10px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            Explore Fits
          </span>
          <h2 className={`font-serif font-light text-3xl sm:text-4xl tracking-wide ${textClass} mt-1`}>
            Shop By Category
          </h2>
          <div className="w-12 h-[1px] bg-secondary/60 mx-auto mt-4" />
        </div>

        {/* Visual Category Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categoriesList.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="relative aspect-[4/5] w-full rounded-none overflow-hidden group flex items-end p-8 shadow-luxury bg-stone-100"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="relative z-10 w-full flex justify-between items-center text-white">
                <span className="font-serif font-light text-xl tracking-wide uppercase">
                  {cat.name}
                </span>
                <span className="text-[9px] font-sans font-medium tracking-[0.2em] border-b border-white py-1 uppercase group-hover:text-accent group-hover:border-accent transition-colors duration-300 font-sans">
                  Discover
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. TRENDING NOW SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 select-none border-t border-stone-200/30">
        <div className="text-center space-y-2">
          <span className={`text-[10px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            Trending Styles
          </span>
          <h2 className={`font-serif font-light text-3xl sm:text-4xl tracking-wide ${textClass} mt-1`}>
            Trending Now
          </h2>
          <div className="w-12 h-[1px] bg-secondary/60 mx-auto mt-4" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
          {renderTrending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 9. CUSTOMER REVIEWS */}
      <section className={sectionBgClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className={`text-[10px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
              Patron Statements
            </span>
            <h2 className={`font-serif font-light text-3xl sm:text-4xl tracking-wide ${textClass} mt-1`}>
              Customer Testimonials
            </h2>
            <div className="w-12 h-[1px] bg-secondary/60 mx-auto mt-4" />
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Karan Malhotra',
                city: 'Mumbai',
                text: 'The fabric density is outstanding. Unlike typical streetwear tees that lose their boxy shape around the neck after a few washes, ARVIIK remains as heavyweight as day one.',
                stars: 5,
              },
              {
                name: 'Elena Rostova',
                city: 'Delhi',
                text: 'Purchased the Polarize Vintage Cream tee. Absolutely impressed by the structured drape. Shipping was prompt, and the detailed sizing guide was perfectly accurate.',
                stars: 5,
              },
              {
                name: 'Rohan Sharma',
                city: 'Bangalore',
                text: 'Incredibly premium packaging and presentation. The oversized cut provides that authentic relaxed aesthetic. A truly refined addition to my collection.',
                stars: 5,
              },
            ].map((review, i) => (
              <div
                key={i}
                className={`${cardBgClass} p-8 rounded-none border border-stone-200/40 shadow-luxury flex flex-col space-y-6`}
              >
                <div className="flex items-center text-secondary">
                  {[...Array(review.stars)].map((_, starIdx) => (
                    <Star key={starIdx} className="h-3.5 w-3.5 fill-current text-current stroke-[1.5]" />
                  ))}
                </div>
                <p className={`text-[13px] ${isDarkTheme ? 'text-stone-300' : 'text-stone-600'} leading-relaxed font-light italic`}>
                  "{review.text}"
                </p>
                <div className={`pt-4 border-t ${isDarkTheme ? 'border-stone-850' : 'border-stone-100'} flex justify-between items-center text-[9px] font-semibold ${subTextClass} uppercase tracking-[0.2em] font-sans`}>
                  <span>{review.name}</span>
                  <span>{review.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* 10. INSTAGRAM LOOKS */}
      <section className="py-20 space-y-12 select-none border-t border-stone-200/30">
        <div className="text-center space-y-2">
          <span className={`text-[10px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            Lifestyle Lookbook
          </span>
          <h2 className={`font-serif font-light text-3xl sm:text-4xl tracking-wide ${textClass} mt-1`}>
            #ARVIIKLOOKS
          </h2>
          <div className="w-12 h-[1px] bg-secondary/60 mx-auto mt-4" />
        </div>

        {/* Grid of gallery pictures */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 px-4 sm:px-6 lg:px-8">
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
                className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-stone-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                <span className="text-white text-[9px] font-sans font-medium tracking-[0.25em] uppercase border border-white/60 px-4 py-2.5 bg-transparent hover:bg-white hover:text-stone-950 transition-colors duration-300">
                  View Fit
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
