'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Search, ShoppingBag, Heart, User } from 'lucide-react';

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
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-stone-200/40 select-none">
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

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Hamburger */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-stone-900 focus:outline-none"
                aria-label="Toggle Menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold tracking-widest uppercase">
              <Link href="/shop" prefetch={true} className="text-stone-900 hover:text-stone-500 transition-colors">
                Shop
              </Link>
              
              {/* Categories Dropdown */}
              <div className="relative group py-2">
                <button className="text-stone-900 hover:text-stone-500 transition-colors flex items-center gap-1 uppercase tracking-widest font-semibold focus:outline-none">
                  <span>Categories</span>
                  <span className="text-[10px]">▼</span>
                </button>
                <div className="absolute top-full left-0 hidden group-hover:block w-52 bg-white border border-stone-200 shadow-lg rounded-sm py-2 z-50 animate-fade-in">
                  <Link
                    href="/shop?category=Limited+Edition"
                    prefetch={true}
                    className="block px-4 py-2 text-[11px] font-bold text-stone-800 hover:bg-stone-100 hover:text-stone-950 transition-colors uppercase tracking-wider"
                  >
                    🔥 Limited Edition
                  </Link>
                  <Link
                    href="/shop?category=On+Fire"
                    prefetch={true}
                    className="block px-4 py-2 text-[11px] font-bold text-stone-800 hover:bg-stone-100 hover:text-stone-950 transition-colors uppercase tracking-wider"
                  >
                    ⚡ On Fire
                  </Link>
                  <Link
                    href="/shop?category=Graphic+Tee"
                    prefetch={true}
                    className="block px-4 py-2 text-[11px] font-bold text-stone-800 hover:bg-stone-100 hover:text-stone-950 transition-colors uppercase tracking-wider"
                  >
                    🎨 Graphic Tee
                  </Link>
                  <Link
                    href="/shop?category=Psychology+Edition"
                    prefetch={true}
                    className="block px-4 py-2 text-[11px] font-bold text-stone-800 hover:bg-stone-100 hover:text-stone-950 transition-colors uppercase tracking-wider"
                  >
                    🧠 Psychology Edition
                  </Link>
                </div>
              </div>

              <Link href="/shop?filter=featured" prefetch={true} className="text-stone-900 hover:text-stone-500 transition-colors">
                Featured
              </Link>
              <Link href="/#founders" prefetch={true} className="text-stone-900 hover:text-stone-500 transition-colors">
                Founders
              </Link>
            </nav>

            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="font-syne font-extrabold text-2xl sm:text-3xl tracking-[0.25em] text-stone-900 transition-opacity hover:opacity-85"
              >
                ARVIIK
              </Link>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => setSearchOpen(true)}
                className="text-stone-900 hover:opacity-70 transition-opacity"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <Link
                href="/wishlist"
                className="text-stone-900 hover:opacity-70 transition-opacity relative"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link
                href={user ? "/profile" : "/login"}
                className="text-stone-900 hover:opacity-70 transition-opacity"
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={triggerCartOpen}
                className="text-stone-900 hover:opacity-70 transition-opacity relative"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-stone-200 px-6 py-6 space-y-4">
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-bold uppercase tracking-widest text-stone-900"
            >
              Shop All
            </Link>

            <div className="pt-2 border-t border-stone-100 space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Categories
              </span>
              <Link
                href="/shop?category=Limited+Edition"
                onClick={() => setMobileOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 pl-2"
              >
                🔥 Limited Edition
              </Link>
              <Link
                href="/shop?category=On+Fire"
                onClick={() => setMobileOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 pl-2"
              >
                ⚡ On Fire
              </Link>
              <Link
                href="/shop?category=Graphic+Tee"
                onClick={() => setMobileOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 pl-2"
              >
                🎨 Graphic Tee
              </Link>
              <Link
                href="/shop?category=Psychology+Edition"
                onClick={() => setMobileOpen(false)}
                className="block text-xs font-semibold uppercase tracking-wider text-stone-800 hover:text-stone-950 pl-2"
              >
                🧠 Psychology Edition
              </Link>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-3">
              <Link
                href="/shop?filter=featured"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-bold uppercase tracking-widest text-stone-900"
              >
                Featured
              </Link>
              <Link
                href="/#founders"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-bold uppercase tracking-widest text-stone-900"
              >
                Founders
              </Link>
            </div>
          </div>
        )}

        {/* Search Modal */}
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
                  placeholder="Search oversized tees, graphics..."
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
      {/* Spacer for fixed header */}
      <div className="h-24 sm:h-28 w-full" />
    </>
  );
}
