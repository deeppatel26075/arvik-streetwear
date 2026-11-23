'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, Shield, Truck, RefreshCw, Award, Check, X } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [showJoined, setShowJoined] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setEmail('');
      setShowJoined(true);
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-400 text-xs select-none">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 pt-14 pb-6 space-y-10">

        {/* Brand + Social Icons */}
        <div className="text-center space-y-5">
          <span className="font-syne font-extrabold text-2xl tracking-[0.3em] text-white block">
            ARVIIK
          </span>
          <p className="text-stone-400 max-w-xs mx-auto text-xs leading-relaxed">
            Premium oversized streetwear crafted from 240 GSM cotton. Designed for creators, dreamers, and those who wear their identity with confidence.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a href="https://www.instagram.com/arviik.in" aria-label="ARVIIK on Instagram" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.threads.net" aria-label="ARVIIK on Threads" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z"/></svg>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-800" />

        {/* Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold text-lime-400 uppercase text-[10px] tracking-[0.2em]">Navigation</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
              <li><Link href="/shop?filter=new" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/#collections" className="hover:text-white transition-colors">Collections</Link></li>
              <li><Link href="/shop?filter=bestseller" className="hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/lookbook" className="hover:text-white transition-colors">Lookbook</Link></li>
            </ul>
          </div>

          {/* About Us */}
          <div className="space-y-3">
            <h4 className="font-bold text-lime-400 uppercase text-[10px] tracking-[0.2em]">About Us</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link href="/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Journal</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-lime-400 uppercase text-[10px] tracking-[0.2em]">Customer Support</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Exchanges</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-lime-400 uppercase text-[10px] tracking-[0.2em]">Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Exchange Policy</Link></li>
              <li><Link href="/payment-policy" className="hover:text-white transition-colors">Payment Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-800" />

        {/* Join the ARVIIK Club */}
        <div className="space-y-4">
          <h4 className="font-bold text-lime-400 uppercase text-[10px] tracking-[0.2em]">Join the ARVIIK Club</h4>
          <p className="text-xs text-stone-400">
            Get early access to new drops, exclusive offers & more.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-3 max-w-md">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-stone-900 border border-stone-700 rounded-sm px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-stone-500 transition-colors"
            />
            <button
              type="submit"
              className="w-full bg-white text-stone-950 font-extrabold uppercase text-xs tracking-[0.2em] py-3 rounded-sm hover:bg-lime-400 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-800" />

        {/* Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-stone-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Secure Payments</p>
              <p className="text-[9px] text-stone-500">100% secure & trusted</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Truck className="w-5 h-5 text-stone-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Fast Shipping</p>
              <p className="text-[9px] text-stone-500">Pan India & worldwide</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-stone-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Easy Exchanges</p>
              <p className="text-[9px] text-stone-500">7-day size exchange</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Award className="w-5 h-5 text-stone-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Premium Quality</p>
              <p className="text-[9px] text-stone-500">Crafted to last</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-800" />

        {/* Payment Methods */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 py-2">
          {/* Visa */}
          <span className="text-white font-extrabold text-lg tracking-wider italic">VISA</span>
          {/* Mastercard */}
          <div className="flex items-center -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-red-600" />
            <div className="w-5 h-5 rounded-full bg-yellow-500 opacity-80" />
          </div>
          {/* UPI */}
          <span className="text-white font-bold text-sm tracking-wide">UPI</span>
          {/* RuPay */}
          <span className="text-white font-bold text-sm italic">RuPay<sup className="text-[6px]">®</sup></span>
          {/* Paytm */}
          <span className="text-white font-bold text-sm">Pay<span className="text-sky-400">tm</span></span>
          {/* GPay */}
          <span className="text-white font-bold text-sm">G <span className="text-stone-400">Pay</span></span>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-800" />

        {/* Copyright & Bottom Links */}
        <div className="text-center space-y-2 pb-2">
          <p className="text-[10px] tracking-widest uppercase text-stone-500">
            ARVIIK
          </p>
          <p className="text-[10px] tracking-widest uppercase text-stone-500">
            Wear Your Identity.
          </p>
          <div className="flex items-center justify-center space-x-4 pt-1">
            <Link href="/privacy-policy" className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-stone-700">|</span>
            <Link href="/terms" className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>

        {/* Scroll to Top */}
        <div className="flex justify-center">
          <button
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-white hover:border-white transition-all hover:bg-stone-900"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showJoined && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Welcome to the ARVIIK Club"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowJoined(false)} />
          <div className="animate-fade-in relative w-full max-w-sm bg-stone-950 border border-lime-400/25 rounded-2xl p-8 text-center space-y-5 shadow-[0_0_70px_-15px_rgba(163,230,53,0.35)]">
            <button
              type="button"
              onClick={() => setShowJoined(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="mx-auto w-14 h-14 rounded-full bg-lime-400/10 border border-lime-400/40 flex items-center justify-center">
              <Check className="h-6 w-6 text-lime-400" strokeWidth={3} />
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold text-lime-400 uppercase tracking-[0.35em] block">
                Membership Confirmed
              </span>
              <h3 className="font-syne font-extrabold text-2xl uppercase tracking-wide text-white">
                Welcome To The Club
              </h3>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-[280px] mx-auto">
              You&apos;re officially on the list. Early access to drops, private restocks, and member-only offers land straight in your inbox.
            </p>

            <button
              type="button"
              onClick={() => setShowJoined(false)}
              className="w-full bg-lime-400 text-stone-950 font-extrabold uppercase text-xs tracking-[0.2em] py-3 rounded-sm hover:bg-lime-300 transition-all duration-200 active:scale-[0.97]"
            >
              Keep Exploring
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
