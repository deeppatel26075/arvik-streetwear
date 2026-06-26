'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
  id: number;
  image: string;
  sub: string;
  title: string;
  btnText: string;
  btnColor: string;
  href: string;
}

export default function HeroSlider() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1600',
      sub: 'THE ESSENTIAL LUXURY',
      title: 'ARVIIK SIGNATURE TEES',
      btnText: 'SHOP COLLECTION',
      btnColor: 'bg-white text-stone-900 hover:bg-stone-50 border border-stone-200/50',
      href: '/shop'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1600',
      sub: 'NEW COUTURE DROP',
      title: 'ARCHITECTURAL PRINTS',
      btnText: 'DISCOVER COLLECTION',
      btnColor: 'bg-stone-900 text-white hover:bg-stone-800 border border-stone-850',
      href: '/shop?tag=NEW+ARRIVAL'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1600',
      sub: '240 GSM HEAVYWEIGHT COTTON',
      title: 'MINIMALIST LUXURY FITS',
      btnText: 'EXPLORE STYLES',
      btnColor: 'bg-white text-stone-900 hover:bg-stone-50 border border-stone-200/50',
      href: '/shop?category=Oversized+T-Shirts'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="w-full select-none">
      <div className="relative w-full h-[65vh] sm:h-[80vh] bg-stone-950 overflow-hidden">
        {/* Slides view wrapper */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              className="w-full h-full relative"
            >
              {/* Background image */}
              <img
                src={slides[currentIdx].image}
                alt="Streetwear Banner"
                className="object-cover w-full h-full opacity-40 absolute inset-0"
              />
              {/* Dark tint gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
 
              {/* Slide content overlay (Centered absolutely) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-12">
                <div className="max-w-3xl space-y-5">
                  {/* Slogan */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="font-sans text-[9px] sm:text-[10px] tracking-[0.4em] text-stone-200 font-semibold uppercase"
                  >
                    {slides[currentIdx].sub}
                  </motion.p>
 
                  {/* Big Heading */}
                  <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="font-serif text-3xl sm:text-6xl lg:text-7xl leading-tight text-white tracking-[0.05em] font-light uppercase"
                  >
                    {slides[currentIdx].title}
                  </motion.h1>
 
                  {/* Button CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="pt-4"
                  >
                    <Link
                      href={slides[currentIdx].href}
                      className={`inline-block font-sans font-semibold text-[9px] sm:text-[10px] tracking-[0.25em] px-8 sm:px-10 py-4 rounded-none uppercase transition-all duration-300 active:scale-97 shadow-xs ${slides[currentIdx].btnColor}`}
                    >
                      {slides[currentIdx].btnText}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
 
        {/* Muted Numeric Tracker (Bottom Right) */}
        <div className="absolute bottom-8 right-8 sm:right-12 text-white font-sans text-[11px] tracking-[0.25em] font-semibold select-none z-10 flex items-center space-x-2">
          <span>0{currentIdx + 1}</span>
          <span className="text-white/40">/</span>
          <span className="text-white/40">0{slides.length}</span>
        </div>
        
        {/* Left/Right Click zones for desktop navigation */}
        <button
          onClick={() => setCurrentIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-xs font-semibold tracking-[0.2em] font-sans hidden sm:block z-10 uppercase"
        >
          PRV
        </button>
        <button
          onClick={() => setCurrentIdx((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors text-xs font-semibold tracking-[0.2em] font-sans hidden sm:block z-10 uppercase"
        >
          NXT
        </button>
      </div>
    </section>
  );
}
