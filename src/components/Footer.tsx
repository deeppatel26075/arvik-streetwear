'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 text-xs py-16 border-t border-stone-900 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <span className="font-syne font-extrabold text-xl tracking-[0.25em] text-white block">
              ARVIIK
            </span>
            <p className="text-stone-400 max-w-sm text-xs leading-relaxed">
              Luxury printed oversized T-shirts. Crafted with 240 GSM premium cotton, bold designs, and modern minimalist fits. Wear your identity.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link href="/shop?filter=featured" className="hover:text-white transition-colors">Featured</Link></li>
              <li><Link href="/#founders" className="hover:text-white transition-colors">The Founders</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-widest">Customer Support</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/login" className="hover:text-white transition-colors">Account Login</Link></li>
              <li><Link href="/wishlist" className="hover:text-white transition-colors">Saved Items</Link></li>
              <li><Link href="/admin" className="text-stone-500 hover:text-white transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between text-[10px] tracking-widest uppercase text-stone-500">
          <p>© {new Date().getFullYear()} ARVIIK. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Premium Oversized Streetwear</p>
        </div>
      </div>
    </footer>
  );
}
