'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  Heart,
  User,
  ChevronRight,
  Sparkles,
  Star,
  Flame,
  Tag,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Truck,
  Shirt
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, wishlist } = useCart();
  const { user } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const triggerCartOpen = () => {
    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full max-w-full overflow-x-hidden z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-stone-200/40 select-none">
        {/* Top Marquee Announcement Bar */}
        <div className="bg-stone-950 text-lime-400 py-2 overflow-hidden border-b border-stone-900/10 text-[9px] font-bold uppercase tracking-[0.2em] select-none">
          <div className="whitespace-nowrap flex animate-marquee">
            <span className="flex-shrink-0">
              ⚡ BUY ANY 3 T-SHIRTS AT ₹1199 — USE CODE: B31199 &nbsp;&nbsp;&nbsp;&nbsp; ⚡ FREE SHIPPING ACROSS INDIA ON ORDERS ABOVE ₹1499 &nbsp;&nbsp;&nbsp;&nbsp; ⚡ 10% OFF ON ALL PREPAID ORDERS &nbsp;&nbsp;&nbsp;&nbsp;
            </span>
            <span className="flex-shrink-0">
              ⚡ BUY ANY 3 T-SHIRTS AT ₹1199 — USE CODE: B31199 &nbsp;&nbsp;&nbsp;&nbsp; ⚡ FREE SHIPPING ACROSS INDIA ON ORDERS ABOVE ₹1499 &nbsp;&nbsp;&nbsp;&nbsp; ⚡ 10% OFF ON ALL PREPAID ORDERS &nbsp;&nbsp;&nbsp;&nbsp;
            </span>
            <span className="flex-shrink-0">
              ⚡ BUY ANY 3 T-SHIRTS AT ₹1199 — USE CODE: B31199 &nbsp;&nbsp;&nbsp;&nbsp; ⚡ FREE SHIPPING ACROSS INDIA ON ORDERS ABOVE ₹1499 &nbsp;&nbsp;&nbsp;&nbsp; ⚡ 10% OFF ON ALL PREPAID ORDERS &nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>

        {/* Main Navbar Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 py-4">
          <div className="flex items-center justify-between">
            
            {/* Hamburger Button (Opens Hamburger Menu Drawer - Top Layer zIndex 9999999) */}
            <div className="flex items-center" style={{ zIndex: 9999999 }}>
              <button
                onClick={() => setMobileOpen(true)}
                className="text-stone-900 hover:text-stone-600 focus:outline-none p-2 rounded-xs hover:bg-stone-100 transition-colors flex items-center gap-2"
                aria-label="Open Hamburger Menu"
              >
                <Menu className="h-7 w-7 sm:h-8 sm:w-8 text-stone-900 stroke-[2.2]" />
                <span className="hidden sm:inline-block text-xs sm:text-sm font-black uppercase tracking-widest text-stone-900">
                  MENU
                </span>
              </button>
            </div>



            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="font-syne font-extrabold text-2xl sm:text-3xl tracking-[0.25em] text-stone-900 transition-opacity hover:opacity-85"
              >
                ARVIIK
              </Link>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3.5 sm:space-x-5">
              <button
                onClick={() => setSearchOpen(true)}
                className="text-stone-900 hover:opacity-70 transition-opacity p-1"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href="/wishlist"
                className="text-stone-900 hover:opacity-70 transition-opacity relative p-1"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                href={user ? "/profile" : "/login"}
                className="text-stone-900 hover:opacity-70 transition-opacity p-1"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={triggerCartOpen}
                className="text-stone-900 hover:opacity-70 transition-opacity relative p-1"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Search Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
            <div className="bg-white w-full max-w-xl p-6 rounded-sm shadow-xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-stone-900">
                  Search Products
                </h3>
                <button onClick={() => setSearchOpen(false)} className="text-stone-500 hover:text-stone-900">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search oversized tees, graphics, editions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-grow border border-stone-300 rounded-sm px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  className="bg-stone-900 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-sm hover:bg-stone-800 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Hamburger Menu Drawer Overlay — outside header so z-index is not capped by header's stacking context */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99999] bg-stone-950/80 backdrop-blur-md flex justify-start animate-fade-in">
          <div className="w-full max-w-md bg-white h-full min-h-screen overflow-y-auto p-6 shadow-2xl flex flex-col justify-between space-y-6 border-r border-stone-200">
            
            {/* Drawer Top Header & Close Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="font-syne font-extrabold text-xl tracking-[0.2em] text-stone-950">
                    ARVIIK
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 px-2 py-0.5 rounded-xs">
                    MENU
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-full bg-stone-100 text-stone-900 hover:bg-stone-200 transition-colors"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SHOP ALL Header Link & Search Bar */}
              <div className="space-y-3">
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block font-extrabold text-xs tracking-widest uppercase text-stone-950 hover:text-stone-600 transition-colors"
                >
                  SHOP ALL
                </Link>

                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-sm py-2.5 pl-4 pr-10 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>



              {/* FEATURED COLLECTIONS SECTION */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 border-b border-stone-100 pb-1.5">
                  FEATURED COLLECTIONS
                </h3>

                <div className="space-y-1.5 text-xs font-semibold text-stone-800">
                  <Link
                    href="/shop?filter=new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">New Arrivals</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop?filter=bestseller"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">Best Sellers</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop?category=Limited+Edition"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Flame className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">Limited Edition</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop?category=Psychology+Edition"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">Psychology Edition</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop?category=Anime+Edition"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">Anime Edition</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <ShoppingBag className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">All Collection</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>
                </div>
              </div>

              {/* SHOP BY SECTION */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 border-b border-stone-100 pb-1.5">
                  SHOP BY
                </h3>

                <div className="space-y-1.5 text-xs font-semibold text-stone-800">
                  <Link
                    href="/shop?gender=men"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">Men</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop?gender=unisex"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Shirt className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">Unisex</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>
                </div>
              </div>

              {/* MY ACCOUNT SECTION */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 border-b border-stone-100 pb-1.5">
                  MY ACCOUNT
                </h3>

                <div className="grid grid-cols-4 gap-2 text-center pt-1">
                  <Link
                    href={user ? "/profile" : "/login"}
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xs transition-colors group"
                  >
                    <User className="w-4 h-4 text-stone-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                      My Account
                    </span>
                  </Link>

                  <Link
                    href="/profile#orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xs transition-colors group"
                  >
                    <Truck className="w-4 h-4 text-stone-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                      Track Order
                    </span>
                  </Link>

                  <Link
                    href="/contact#returns"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xs transition-colors group"
                  >
                    <RefreshCw className="w-4 h-4 text-stone-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                      Return
                    </span>
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xs transition-colors group"
                  >
                    <Heart className="w-4 h-4 text-stone-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                      Wishlist
                    </span>
                  </Link>
                </div>
              </div>

              {/* SUPPORT SECTION */}
              <div className="space-y-3 pt-2 pb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 border-b border-stone-100 pb-1.5">
                  SUPPORT
                </h3>

                <div className="space-y-2 text-xs font-semibold text-stone-800">
                  <Link
                    href="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center space-x-3 py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <PhoneCall className="w-4 h-4 text-stone-600" />
                    <span className="uppercase tracking-wider">Contact Us</span>
                  </Link>

                  <a
                    href="https://api.whatsapp.com/send?phone=919876543210&text=Hi%20ARVIIK%20Support"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center space-x-3 py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors text-emerald-700"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    <span className="uppercase tracking-wider">WhatsApp Support</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      
      {/* Spacer for fixed header */}
      <div className="h-24 sm:h-28 w-full" />
    </>
  );
}
