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

      {/* 4. Editorial Intro Hook */}
      <section className="max-w-4xl mx-auto text-center py-24 px-4 space-y-4 select-none">
        <span className={`text-[9px] ${subTextClass} font-semibold tracking-[0.35em] uppercase block`}>
          THE ART OF SIMPLICITY
        </span>
        <h2 className={`font-serif font-light text-3xl sm:text-5xl tracking-wide ${textClass} leading-tight uppercase`}>
          Architectural Fits. Muted Tones.
        </h2>
        <div className="w-10 h-[1px] bg-secondary/50 mx-auto my-6" />
        <p className="text-xs sm:text-sm font-sans font-light text-stone-500 max-w-xl mx-auto leading-relaxed tracking-wide">
          Engineered with custom-woven 240 GSM French Terry cotton, ARVIIK printed oversized tees present a study in structured drapes, drop-shoulder comfort, and premium high-density aesthetics.
        </p>
      </section>

      {/* 5. OUR BESTSELLERS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-14 select-none">
        <div className="text-center space-y-2">
          <span className={`text-[9px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            THE SIGNATURE EDIT
          </span>
          <h2 className={`font-serif font-light text-2xl sm:text-3xl tracking-wide ${textClass} uppercase`}>
            Our Bestsellers
          </h2>
        </div>

        {/* Products Grid - Borderless, spacious */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16">
          {renderBestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* DISCOVER ALL BESTSELLERS Button */}
        <div className="pt-8 flex justify-center">
          <Link
            href="/shop?tag=BESTSELLER"
            className="w-full max-w-xs text-center py-3.5 bg-stone-900 text-white hover:bg-stone-800 font-sans font-semibold text-[10px] tracking-[0.25em] uppercase rounded-none transition-colors duration-300 border border-stone-900"
          >
            DISCOVER THE COLLECTION
          </Link>
        </div>
      </section>

      {/* 6. Editorial Split Panels (Replaces cheap 2-column banners) */}
      <section className="w-full select-none pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panel 1: Graphics */}
          <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-stone-100 overflow-hidden flex flex-col justify-end p-8 sm:p-12 group">
            <img
              src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800"
              alt="Editorial look graphics"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-101 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 space-y-3.5 text-white max-w-xs">
              <span className="text-[9px] text-accent font-semibold tracking-[0.3em] uppercase block">
                COUTURE SERIE 01
              </span>
              <h3 className="font-serif font-light text-2xl sm:text-3.5xl leading-tight uppercase tracking-wider">
                Graphic Prints
              </h3>
              <p className="text-[10px] text-stone-300 font-sans font-light leading-relaxed tracking-wider hidden sm:block">
                Architectural patterns and high-density screens set on premium heavyweight Terry.
              </p>
              <div className="pt-1.5">
                <Link
                  href="/shop?category=Graphic+Prints"
                  className="inline-block text-[9px] font-sans font-semibold uppercase tracking-widest bg-white text-stone-950 px-6 py-3 rounded-none hover:bg-stone-100 transition-colors duration-300"
                >
                  SHOP PRINTS
                </Link>
              </div>
            </div>
          </div>

          {/* Panel 2: Minimalist */}
          <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-stone-100 overflow-hidden flex flex-col justify-end p-8 sm:p-12 group">
            <img
              src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800"
              alt="Editorial look minimalist"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-101 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative z-10 space-y-3.5 text-white max-w-xs">
              <span className="text-[9px] text-accent font-semibold tracking-[0.3em] uppercase block">
                COUTURE SERIE 02
              </span>
              <h3 className="font-serif font-light text-2xl sm:text-3.5xl leading-tight uppercase tracking-wider">
                Minimalist Typo
              </h3>
              <p className="text-[10px] text-stone-300 font-sans font-light leading-relaxed tracking-wider hidden sm:block">
                Clean type settings and micro puff print placements for daily premium aesthetics.
              </p>
              <div className="pt-1.5">
                <Link
                  href="/shop?category=Minimalist+Typo"
                  className="inline-block text-[9px] font-sans font-semibold uppercase tracking-widest bg-white text-stone-950 px-6 py-3 rounded-none hover:bg-stone-100 transition-colors duration-300"
                >
                  SHOP MINIMALIST
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. NEW ARRIVALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-14 select-none border-t border-stone-200/20">
        <div className="text-center space-y-2">
          <span className={`text-[9px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            THE FRESH DROP
          </span>
          <h2 className={`font-serif font-light text-2xl sm:text-3xl tracking-wide ${textClass} uppercase`}>
            New Arrivals
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16">
          {renderNewArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 8. Full-Bleed Inset Lookbook Banner */}
      <section className="w-full bg-stone-950 text-white py-32 px-4 relative overflow-hidden select-none">
        <img
          src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600"
          alt="ARVIIK Lookbook Cover"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6 text-center">
          <span className="text-[9px] text-accent font-semibold tracking-[0.4em] uppercase block">
            HEAVYWEIGHT FRENCH TERRY
          </span>
          <h2 className="font-serif font-light text-3xl sm:text-5xl lg:text-6xl tracking-wider leading-tight uppercase">
            The Signature Fit
          </h2>
          <p className="text-xs sm:text-sm font-sans font-light text-stone-300 max-w-md mx-auto leading-relaxed tracking-wider">
            Our premium T-shirts weigh a heavy 240 GSM. Designed with structured shoulders and a loose drape to preserve the designer silhouette wash after wash.
          </p>
          <div className="pt-4">
            <Link
              href="/shop?category=Oversized+T-Shirts"
              className="inline-flex items-center space-x-2 bg-white text-stone-900 font-sans font-semibold text-[10px] tracking-[0.25em] px-8 py-3.5 rounded-none uppercase hover:bg-stone-50 transition-colors duration-300 border border-stone-200"
            >
              <span>SHOP THE FITS</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. SHOP BY CATEGORY section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-14 select-none border-t border-stone-200/20">
        <div className="text-center space-y-2">
          <span className={`text-[9px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            CATEGORIES DROPS
          </span>
          <h2 className={`font-serif font-light text-2xl sm:text-3xl tracking-wide ${textClass} uppercase`}>
            Shop By Category
          </h2>
        </div>

        {/* Category Blocks - Portrait format */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categoriesList.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="relative aspect-[3/4] w-full rounded-none overflow-hidden group flex items-end p-8 shadow-luxury bg-stone-100 border border-stone-200/10"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-101 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
              <div className="relative z-10 w-full flex justify-between items-center text-white">
                <span className="font-serif font-light text-lg uppercase tracking-wider">
                  {cat.name}
                </span>
                <span className="text-[9px] font-sans font-semibold tracking-[0.25em] border-b border-white pb-0.5 uppercase group-hover:text-accent group-hover:border-accent transition-colors duration-300">
                  DISCOVER
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 10. CUSTOMER TESTIMONIALS (Luxury minimal centered slider representation) */}
      <section className="bg-[#faf9f6] py-28 border-y border-stone-200/20 select-none">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <span className={`text-[9px] ${subTextClass} font-semibold tracking-[0.35em] uppercase block`}>
            PATRON TESTIMONIALS
          </span>
          
          <div className="space-y-4">
            <p className={`font-serif font-light text-lg sm:text-2xl leading-relaxed italic ${textClass}`}>
              "The weight and drape of the 240 GSM cotton is phenomenal. It holds its structured form perfectly after several washes, unlike anything else. ARVIIK is a true luxury essential."
            </p>
            <div className="flex justify-center text-secondary py-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current text-current stroke-[1.5]" />
              ))}
            </div>
            <div className={`text-[9px] font-semibold ${subTextClass} uppercase tracking-[0.25em] pt-2`}>
              — KARAN M. <span className="text-stone-300 font-light mx-2">·</span> MUMBAI
            </div>
          </div>
        </div>
      </section>
 
      {/* 11. #ARVIIKLOOKS Lookbook Grid */}
      <section className="py-24 space-y-14 select-none border-t border-stone-200/20">
        <div className="text-center space-y-2">
          <span className={`text-[9px] ${subTextClass} font-semibold tracking-[0.3em] uppercase block`}>
            LIFESTYLE GALLERIES
          </span>
          <h2 className={`font-serif font-light text-2xl sm:text-3xl tracking-wide ${textClass} uppercase`}>
            #ARVIIKLOOKS
          </h2>
        </div>

        {/* Grid of gallery pictures - borderless */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 px-4 sm:px-6 lg:px-8">
          {[
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600',
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
            'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600',
            'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600',
            'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600',
            'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600'
          ].map((src, i) => (
            <div key={i} className="relative aspect-square w-full group overflow-hidden bg-stone-50">
              <img
                src={src}
                alt={`Lifestyle Look ${i + 1}`}
                className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-stone-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                <span className="text-white text-[9px] font-sans font-semibold tracking-[0.25em] uppercase border border-white/60 px-5 py-2.5 bg-transparent hover:bg-white hover:text-stone-950 transition-colors duration-300">
                  VIEW FIT
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 12. Recently Viewed Slider */}
      <RecentlyViewed />
    </div>
  );
}
