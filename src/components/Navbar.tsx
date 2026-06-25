'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MegaMenu from './Navigation/MegaMenu';
import MobileMenu from './Navigation/MobileMenu';

export default function Navbar() {
  const pathname = usePathname();
  const { cart, wishlist } = useCart();
  const { user, profile } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const announcements = [
    "⚡ Prepaid Orders Will Be Shipped On Priority",
    "🔥 Oversized Tees SALE | Buy Any 3 @1199",
    "⚡ FREE SHIPPING ACROSS INDIA",
    "⚡ EASY RETURNS & COD AVAILABLE"
  ];

  // Rotate announcement messages
  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % announcements.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Listen to mobile bottom nav search requests
  useEffect(() => {
    const handleSearchOpenEvent = () => setSearchOpen(true);
    window.addEventListener('open-search', handleSearchOpenEvent);
    return () => window.removeEventListener('open-search', handleSearchOpenEvent);
  }, []);

  // Skip rendering Navbar on Admin Panel routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const triggerCartOpen = () => {
    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 bg-white border-b border-stone-200">
        {/* Dynamic Announcement Bar */}
        <div className="bg-[#106bc5] text-white py-2 text-center text-xs font-black tracking-wider uppercase select-none transition-all duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={announcementIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {announcements[announcementIdx]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between relative">
          
          {/* Left section: Hamburger (mobile) + Logo */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-stone-900 focus:outline-none p-1"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <Link
              href="/"
              className="flex items-center select-none"
            >
              <img
                src="/logo.jpg"
                alt="ARVIIK Logo"
                className="h-10 w-auto object-contain mix-blend-multiply"
              />
            </Link>
          </div>

          {/* Center section: Mega Menu hover link row (Desktop Only) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-black tracking-widest uppercase select-none">
            <div
              className="relative py-2 cursor-pointer"
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <span className="text-stone-900 hover:text-secondary transition-colors">MEN</span>
              {showMegaMenu && <MegaMenu onClose={() => setShowMegaMenu(false)} />}
            </div>

            <Link href="/shop?tag=NEW+ARRIVAL" className="text-stone-900 hover:text-secondary transition-colors">
              NEW ARRIVALS
            </Link>

            <Link href="/shop?category=Oversized+T-Shirts" className="text-stone-900 hover:text-secondary transition-colors">
              OVERSIZED T-SHIRTS
            </Link>

            <Link href="/shop?category=Graphic+Prints" className="text-stone-900 hover:text-secondary transition-colors">
              GRAPHIC PRINTS
            </Link>

            <Link href="/shop?category=Minimalist+Typo" className="text-stone-900 hover:text-secondary transition-colors">
              MINIMALIST TYPO
            </Link>

            <Link href="/shop?tag=BESTSELLER" className="text-stone-900 hover:text-secondary transition-colors text-sale">
              BESTSELLERS
            </Link>
          </nav>

          {/* Right section: Action Icons */}
          <div className="flex items-center space-x-4 sm:space-x-5">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-stone-900 hover:text-secondary transition-opacity p-1 cursor-pointer"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href="/wishlist"
              className="text-stone-900 hover:text-secondary transition-opacity relative p-1 hidden sm:block"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-sale text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href={user ? '/account' : '/login'}
              className="text-stone-900 hover:text-secondary transition-opacity p-1 hidden sm:block"
            >
              <User className="h-5 w-5" />
            </Link>

            <button
              onClick={triggerCartOpen}
              className="text-stone-900 hover:text-secondary transition-opacity relative p-1"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to push content down below fixed Navbar */}
      <div className="h-24 w-full" />

      {/* Full-Screen Mobile Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAdmin={profile?.role === 'admin'}
      />

      {/* Search Autocomplete Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex items-start justify-center pt-24 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="bg-white w-full max-w-xl p-6 shadow-2xl rounded-sm border border-stone-100"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <h3 className="font-syne font-bold uppercase text-stone-900 tracking-wider text-sm">
                  Search ARVIIK Catalog
                </h3>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-stone-500 hover:text-stone-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
                    setSearchOpen(false);
                  }
                }}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for black oversized tees, graphic prints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-250 px-4 py-3 text-sm focus:outline-none focus:border-stone-900"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-3.5 text-stone-500 hover:text-stone-900"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

