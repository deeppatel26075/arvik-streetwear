'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Skip rendering Footer on Admin Panel routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-20 pb-10 border-t border-stone-900 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-stone-900">
          
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <span className="font-serif font-light text-lg tracking-[0.25em] text-white block uppercase">
                ARVIIK
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm tracking-wide leading-relaxed font-sans font-light">
              Premium printed oversized T-shirts. Crafted with custom-developed heavyweight Terry cotton and minimalist graphics to present your identity.
            </p>
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white block font-sans">
                JOIN THE DROP LIST
              </span>
              {subscribed ? (
                <p className="text-xs text-stone-400 italic font-sans font-light">Welcome to the inner circle. Stay tuned for drop notifications.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-sm font-sans">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-grow bg-stone-900 border border-stone-850 text-stone-200 text-xs px-4 py-3.5 focus:outline-none focus:border-stone-500 rounded-none border-r-0"
                  />
                  <button
                    type="submit"
                    className="bg-white text-stone-950 text-[10px] font-semibold px-6 py-3.5 hover:bg-stone-100 transition-colors uppercase tracking-[0.2em] rounded-none cursor-pointer"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white font-sans">
              SHOP COLLECTION
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-sans font-light tracking-wide">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  All T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Graphic+Prints" className="hover:text-white transition-colors">
                  Graphic Prints
                </Link>
              </li>
              <li>
                <Link href="/shop?category=Minimalist+Typo" className="hover:text-white transition-colors">
                  Minimalist Typo
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=featured" className="hover:text-white transition-colors">
                  Featured Drops
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white font-sans">
              CUSTOMER HELP
            </h4>
            <ul className="space-y-2 text-xs text-stone-400 font-sans font-light tracking-wide">
              <li>
                <Link href="/#size-guide" className="hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-stone-500 hover:text-white transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-stone-500 text-[9px] tracking-[0.2em] uppercase font-sans font-medium">
          <p>© {new Date().getFullYear()} ARVIIK CLOTHING CO. WEAR YOUR IDENTITY.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Razorpay Secured</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
