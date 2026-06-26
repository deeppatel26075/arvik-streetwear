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
    <section className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-4 pb-2 select-none">
      <div className="relative w-full h-[45vh] sm:h-[65vh] bg-stone-950 rounded-none sm:rounded-lg overflow-hidden shadow-luxury">
        {/* Slides view wrapper */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="w-full h-full relative"
            >
              {/* Background image */}
              <img
                src={slides[currentIdx].image}
                alt="Streetwear Banner"
                className="object-cover w-full h-full opacity-35 absolute inset-0"
              />
              {/* Dark tint gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/25" />
 
              {/* Slide content overlay */}
              <div className="absolute inset-0 flex items-center justify-start text-left p-6 sm:p-12 md:p-16">
                <div className="max-w-2xl space-y-4">
                  {/* Slogan */}
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="font-sans text-[10px] sm:text-xs tracking-[0.35em] text-stone-300 font-semibold uppercase"
                  >
                    {slides[currentIdx].sub}
                  </motion.p>
 
                  {/* Big Heading */}
                  <motion.h1
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-tight text-white tracking-wide font-light"
                  >
                    {slides[currentIdx].title}
                  </motion.h1>
 
                  {/* Button CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="pt-2"
                  >
                    <Link
                      href={slides[currentIdx].href}
                      className={`inline-block font-sans font-medium text-[10px] sm:text-xs tracking-[0.25em] px-7 sm:px-9 py-3.5 rounded-none uppercase transition-all duration-300 active:scale-97 shadow-xs ${slides[currentIdx].btnColor}`}
                    >
                      {slides[currentIdx].btnText}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
 
        {/* Muted Linear Indicators */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center items-center space-x-2.5 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-6 h-[2px] transition-all duration-300 focus:outline-none ${
                currentIdx === idx ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
