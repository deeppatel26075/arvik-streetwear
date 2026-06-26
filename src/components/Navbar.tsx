'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
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
  const [activeSettings, setActiveSettings] = useState<any>({});

  const announcements = [
    "⚡ Prepaid Orders Will Be Shipped On Priority",
    "🔥 Premium Oversized Tees | Starting From ₹899",
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

  // Fetch settings dynamically
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = localStorage.getItem('arviik_custom_settings');
        if (stored) {
          setActiveSettings(JSON.parse(stored));
        }

        const { data } = await supabase.from('site_settings').select('*');
        if (data && data.length > 0) {
          const settingsMap = data.reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
          setActiveSettings(settingsMap);
          localStorage.setItem('arviik_custom_settings', JSON.stringify(settingsMap));
        }
      } catch (e) {
        console.error('Failed to load settings in navbar:', e);
      }
    };

    loadSettings();
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

  // Determine dynamic classes based on background theme config
  const bgConfig = activeSettings?.general_config || {};
  const bgStyleVal = bgConfig.bg_style || 'default';
  const customBgColorVal = bgConfig.custom_bg_color || '#faf9f6';

  let headerBgClass = 'bg-[#faf9f6]/95 backdrop-blur-md border-stone-200/50 text-stone-900';
  let navTextClass = 'text-stone-900 hover:text-secondary transition-colors font-sans text-[10px] tracking-[0.18em] font-semibold';
  let iconColorClass = 'text-stone-900 hover:text-secondary';
  let announcementBgColor = '#1c1917';
  let announcementTextColor = 'text-white';

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

  const isDark = bgStyleVal === 'charcoal' || isDarkCustom();

  if (bgStyleVal === 'charcoal') {
    headerBgClass = 'bg-stone-950/95 backdrop-blur-md border-stone-900 text-white';
    navTextClass = 'text-stone-300 hover:text-secondary transition-colors font-sans text-[10px] tracking-[0.18em] font-semibold';
    iconColorClass = 'text-stone-100 hover:text-secondary';
    announcementBgColor = '#0a0a0a';
  } else if (bgStyleVal === 'sepia') {
    headerBgClass = 'bg-[#f4efe6]/95 backdrop-blur-md border-stone-300/50 text-stone-900';
    navTextClass = 'text-stone-850 hover:text-secondary transition-colors font-sans text-[10px] tracking-[0.18em] font-semibold';
    iconColorClass = 'text-stone-850 hover:text-secondary';
    announcementBgColor = '#503f33';
  } else if (bgStyleVal === 'custom-color') {
    headerBgClass = `backdrop-blur-md border-stone-200/50`;
    if (isDark) {
      headerBgClass += ' text-white';
      navTextClass = 'text-stone-300 hover:text-secondary transition-colors font-sans text-[10px] tracking-[0.18em] font-semibold';
      iconColorClass = 'text-stone-100 hover:text-stone-300';
      announcementBgColor = '#121212';
    } else {
      headerBgClass += ' text-stone-900';
      navTextClass = 'text-stone-805 hover:text-secondary transition-colors font-sans text-[10px] tracking-[0.18em] font-semibold';
      iconColorClass = 'text-stone-900 hover:text-secondary';
      announcementBgColor = '#1c1917';
    }
  }

  return (
    <>
      <header 
        className={`fixed top-0 left-0 w-full z-40 border-b transition-colors duration-300 ${headerBgClass}`}
        style={{ backgroundColor: bgStyleVal === 'custom-color' ? customBgColorVal : undefined }}
      >
        {/* Dynamic Announcement Bar */}
        <div 
          className="text-white py-1.5 text-center text-[9px] font-semibold tracking-[0.25em] uppercase select-none transition-all duration-300"
          style={{ backgroundColor: announcementBgColor }}
        >
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
          
          {/* Left section: Hamburger (mobile) */}
          <div className="flex items-center space-x-3.5 z-10">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-stone-900 focus:outline-none p-1"
              style={{ color: isDark ? '#ffffff' : undefined }}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          {/* Centered Logo (Mobile/Desktop adaptive) */}
          <Link
            href="/"
            className="flex items-center select-none absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 md:relative md:left-auto md:top-auto md:transform-none"
          >
            <img
              src="/logo.jpg"
              alt="ARVIIK Logo"
              className="h-8 md:h-10 w-auto object-contain mix-blend-multiply"
            />
          </Link>

          {/* Center section: Mega Menu hover link row (Desktop Only) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-black tracking-widest uppercase select-none">
            <div
              className="relative py-2 cursor-pointer"
              onMouseEnter={() => setShowMegaMenu(true)}
              onMouseLeave={() => setShowMegaMenu(false)}
            >
              <span className={navTextClass}>MEN</span>
              {showMegaMenu && <MegaMenu onClose={() => setShowMegaMenu(false)} />}
            </div>

            <Link href="/shop?tag=NEW+ARRIVAL" className={navTextClass}>
              NEW ARRIVALS
            </Link>

            <Link href="/shop?category=Oversized+T-Shirts" className={navTextClass}>
              OVERSIZED T-SHIRTS
            </Link>

            <Link href="/shop?category=Graphic+Prints" className={navTextClass}>
              GRAPHIC PRINTS
            </Link>

            <Link href="/shop?category=Minimalist+Typo" className={navTextClass}>
              MINIMALIST TYPO
            </Link>

            <Link href="/shop?tag=BESTSELLER" className={`${navTextClass} text-sale`}>
              BESTSELLERS
            </Link>
          </nav>

          {/* Right section: Action Icons */}
          <div className="flex items-center space-x-3 md:space-x-5 z-10">
            <button
              onClick={() => setSearchOpen(true)}
              className={`transition-opacity p-1 cursor-pointer ${iconColorClass}`}
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href="/wishlist"
              className={`transition-opacity relative p-1 ${iconColorClass}`}
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
              className={`transition-opacity p-1 hidden md:block ${iconColorClass}`}
            >
              <User className="h-5 w-5" />
            </Link>

            <button
              onClick={triggerCartOpen}
              className={`transition-opacity relative p-1 ${iconColorClass}`}
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

