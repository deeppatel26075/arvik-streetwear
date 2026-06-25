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
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-8 border-t border-stone-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-stone-900">
          
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-3.5 inline-block rounded-xs">
              <img
                src="/logo.jpg"
                alt="ARVIIK Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-stone-400 max-w-sm tracking-wide leading-relaxed">
              Premium printed oversized T-shirts. Crafted with custom heavyweight fabrics and high-density typography to project your identity.
            </p>
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Join the Drop List
              </span>
              {subscribed ? (
                <p className="text-xs text-stone-400 italic">Welcome to the inner circle. Stay tuned for drop notifications.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-sm">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-grow bg-stone-900 border border-stone-800 text-stone-200 text-xs px-4 py-3 focus:outline-none focus:border-stone-500 rounded-l-sm"
                  />
                  <button
                    type="submit"
                    className="bg-white text-stone-950 text-xs font-semibold px-5 py-3 hover:bg-stone-200 transition-colors uppercase tracking-widest rounded-r-sm"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Shop Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  All T-Shirts
                </Link>
              </li>
              <li>
                <Link href="/shop?category=graphic" className="hover:text-white transition-colors">
                  Graphic Prints
                </Link>
              </li>
              <li>
                <Link href="/shop?category=minimalist" className="hover:text-white transition-colors">
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
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
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
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-stone-500 text-[10px] tracking-widest uppercase">
          <p>© {new Date().getFullYear()} ARVIIK CLOTHING. WEAR YOUR IDENTITY.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Razorpay Payments Secure</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
