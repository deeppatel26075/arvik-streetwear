'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

interface HomeClientWrapperProps {
  products: any[];
}

export default function HomeClientWrapper({ products }: HomeClientWrapperProps) {
  const [displayProducts, setDisplayProducts] = React.useState<any[]>(products);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_custom_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasOldMocks = parsed.some((p: any) => p.name === 'ARCHIVE-01 GRAPHIC TEE' || p.name === 'ESSENTIALS LOGO TEE');
        if (hasOldMocks) {
          localStorage.setItem('arviik_custom_products', JSON.stringify(products));
          setDisplayProducts(products);
        } else if (parsed && parsed.length > 0) {
          setDisplayProducts(parsed.filter((p: any) => !p.is_hidden));
        }
      } else {
        localStorage.setItem('arviik_custom_products', JSON.stringify(products));
      }
    } catch (e) {
      console.error('Failed to load custom products:', e);
    }
  }, [products]);

  // Animation variants
  const fadeIn: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const galleryImages = [
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600',
    'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600'
  ];

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <section className="relative h-[90vh] w-full flex items-center justify-center bg-stone-900 overflow-hidden">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/products/mard-paisa-maroon.jpg"
            alt="ARVIIK Streetwear Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-stone-950/45" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 space-y-6 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[10px] sm:text-xs font-bold tracking-[0.4em] uppercase text-stone-300"
          >
            ARVIIK CLOTHING LAB
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-syne font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-[0.1em] uppercase leading-tight"
          >
            WEAR YOUR
            <br />
            <span className="text-stone-100">IDENTITY</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xs sm:text-sm tracking-widest text-stone-300 max-w-md mx-auto leading-relaxed"
          >
            Heavyweight fabrics. Bold printed oversized silhouettes. Premium local craftsmanship.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="pt-6"
          >
            <Link
              href="/shop"
              className="inline-flex items-center space-x-3 bg-white text-stone-950 font-bold uppercase text-xs tracking-[0.2em] px-8 py-4 hover:bg-stone-900 hover:text-white border border-transparent hover:border-white transition-all duration-300 rounded-sm shadow-md"
            >
              <span>Shop Collection</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. NEW DROPS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-5"
        >
          <div>
            <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
              Summer Release 01
            </span>
            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-900 mt-1">
              New Drops
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-stone-900 hover:opacity-75 transition-opacity mt-4 sm:mt-0"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* Product Cards Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {displayProducts.slice(0, 4).map((product) => (
            <motion.div key={product.id} variants={fadeIn}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. BRAND STORY SECTION (EDITORIAL LAYOUT) */}
      <section id="story" className="bg-stone-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Story Text */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="lg:col-span-6 space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
                  Our Philosophy
                </span>
                <h2 className="font-syne font-extrabold text-3xl sm:text-4xl uppercase tracking-wider text-white">
                  Engineered Streetwear
                </h2>
              </div>
              <p className="text-stone-400 text-sm tracking-wide leading-relaxed font-light">
                At ARVIIK, we believe clothing is more than fabric—it is an outward projection of internal identity. Our oversized fits are engineered from custom-woven 240 GSM ring-spun cotton, creating a structure that holds its shape wash after wash.
              </p>
              <p className="text-stone-400 text-sm tracking-wide leading-relaxed font-light">
                Every print uses eco-friendly, premium high-density ink that fuses into the fabric rather than sitting on top, ensuring details remain vibrant over long timelines.
              </p>
              
              <div className="grid grid-cols-3 gap-6 pt-4 text-center border-t border-stone-900">
                <div className="space-y-1">
                  <p className="font-syne font-bold text-lg text-white">240g</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">Heavyweight</p>
                </div>
                <div className="space-y-1">
                  <p className="font-syne font-bold text-lg text-white">100%</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">Fine Cotton</p>
                </div>
                <div className="space-y-1">
                  <p className="font-syne font-bold text-lg text-white">Boxy</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">Street Fit</p>
                </div>
              </div>
            </motion.div>

            {/* Story Image */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="lg:col-span-6 relative aspect-4/5 w-full bg-stone-900 border border-stone-800"
            >
              <Image
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800"
                alt="Streetwear Detail Story"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-90"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. CUSTOMER REVIEWS */}
      <section className="bg-stone-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-1">
            <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
              Verifiable Feedback
            </span>
            <h2 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
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
                text: 'Bought the Archive-01 tee. Absolutely in love with the French Terry fabric weight. Shipping was fast, and the size chart is completely accurate.',
                stars: 5,
              },
              {
                name: 'Rohan Sharma',
                city: 'Bangalore',
                text: 'Super premium packaging and the customer service helped me switch size from XL to L because the fit is extremely oversized. Recommended!',
                stars: 5,
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="bg-white p-6 rounded-xs border border-stone-200/50 shadow-xs flex flex-col space-y-4"
              >
                <div className="flex items-center text-stone-900">
                  {[...Array(review.stars)].map((_, starIdx) => (
                    <Star key={starIdx} className="h-4 w-4 fill-stone-900" />
                  ))}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed italic">
                  "{review.text}"
                </p>
                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <span>{review.name}</span>
                  <span>{review.city}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. INSTAGRAM GALLERY */}
      <section className="py-20 space-y-10">
        <div className="text-center space-y-1">
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            #ARVIIKLAB
          </span>
          <h2 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
            Instagram Gallery
          </h2>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {galleryImages.map((src, i) => (
            <div key={i} className="relative aspect-square w-full group overflow-hidden bg-stone-150">
              <Image
                src={src}
                alt={`Instagram look ${i + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 16vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold tracking-widest uppercase border border-white px-3 py-1.5 rounded-sm">
                  View Look
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
