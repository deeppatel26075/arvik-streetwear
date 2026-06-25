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
      sub: 'OVERSIZED PRINTED T-SHIRTS',
      title: 'BUY ANY 3 | AT ₹1199',
      btnText: 'SHOP NOW',
      btnColor: 'bg-[#e11d48] text-white hover:bg-rose-700',
      href: '/shop'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1600',
      sub: 'NEW GRAIL ARRIVALS',
      title: 'STREET LEGACY DROP',
      btnText: 'ENTER DROP',
      btnColor: 'bg-stone-950 text-white hover:bg-stone-900 border border-white/20',
      href: '/shop?tag=NEW+ARRIVAL'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1600',
      sub: 'HEAVYWEIGHT FRENCH TERRY',
      title: 'PREMIUM 240 GSM TEES',
      btnText: 'EXPLORE FITS',
      btnColor: 'bg-white text-stone-950 hover:bg-stone-100',
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 select-none">
      <div className="relative w-full h-[55vh] sm:h-[65vh] bg-stone-950 rounded-2xl overflow-hidden shadow-xs">
        {/* Slides view wrapper */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="w-full h-full relative"
            >
              {/* Background image */}
              <img
                src={slides[currentIdx].image}
                alt="Streetwear Banner"
                className="object-cover w-full h-full opacity-40 absolute inset-0"
              />
              {/* Dark tint gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

              {/* Slide content overlay */}
              <div className="absolute inset-0 flex items-center justify-start text-left p-6 sm:p-12 md:p-16">
                <div className="max-w-2xl space-y-4">
                  {/* Slogan */}
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="font-syne font-black text-[10px] sm:text-xs tracking-[0.35em] text-stone-300 uppercase"
                  >
                    {slides[currentIdx].sub}
                  </motion.p>

                  {/* Big Heading */}
                  <motion.h1
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="font-syne font-black text-3xl sm:text-5xl lg:text-6xl leading-none text-white uppercase tracking-wider text-shadow-retro"
                  >
                    {slides[currentIdx].title.includes('|') ? (
                      <>
                        <span>{slides[currentIdx].title.split('|')[0]}</span>
                        <span className="text-[#ffd200] block sm:inline sm:ml-2">
                          {slides[currentIdx].title.split('|')[1]}
                        </span>
                      </>
                    ) : (
                      slides[currentIdx].title
                    )}
                  </motion.h1>

                  {/* Button CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="pt-4"
                  >
                    <Link
                      href={slides[currentIdx].href}
                      className={`inline-block font-syne font-black text-[11px] sm:text-xs tracking-[0.2em] px-8 py-3.5 rounded-full uppercase shadow-lg transform transition-transform active:scale-95 ${slides[currentIdx].btnColor}`}
                    >
                      {slides[currentIdx].btnText}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Diamond Indicators */}
        <div className="absolute bottom-6 left-0 w-full flex justify-center items-center space-x-3.5 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`w-2 h-2 transform rotate-45 transition-all duration-300 border border-white/60 focus:outline-none ${
                currentIdx === idx ? 'bg-[#ffd200] border-[#ffd200] scale-120' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
