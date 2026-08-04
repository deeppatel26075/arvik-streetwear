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
  Flame,
  Sparkles,
  Star,
  Tag,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Truck,
  Shirt,
  Layers,
  ArrowRight
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

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Hamburger */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-stone-900 focus:outline-none p-1"
                aria-label="Toggle Menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6 text-[11px] font-bold tracking-widest uppercase">
              <Link
                href="/shop?filter=new"
                prefetch={true}
                className="text-stone-900 hover:text-stone-500 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                <span>New Arrivals</span>
              </Link>

              <Link
                href="/shop?filter=bestseller"
                prefetch={true}
                className="text-stone-900 hover:text-stone-500 transition-colors flex items-center gap-1"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Best Seller</span>
              </Link>

              <Link
                href="/shop?category=Limited+Edition"
                prefetch={true}
                className="text-stone-900 hover:text-stone-500 transition-colors flex items-center gap-1"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Limited Edition</span>
              </Link>

              <Link
                href="/shop?category=Psychology+Edition"
                prefetch={true}
                className="text-stone-900 hover:text-stone-500 transition-colors"
              >
                <span>Psychology Edition</span>
              </Link>

              <Link
                href="/shop?category=Anime+Edition"
                prefetch={true}
                className="text-stone-900 hover:text-stone-500 transition-colors"
              >
                <span>Anime Edition</span>
              </Link>

              <Link
                href="/shop"
                prefetch={true}
                className="text-stone-900 hover:text-stone-500 transition-colors font-extrabold text-stone-950 border-b-2 border-stone-950 pb-0.5"
              >
                <span>All Collection</span>
              </Link>
            </nav>

            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="font-syne font-extrabold text-2xl sm:text-3xl tracking-[0.25em] text-stone-900 transition-opacity hover:opacity-85"
              >
                ARVIIK
              </Link>
            </div>

            {/* Right Header Action Icons */}
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

        {/* Full-Feature Mobile Navigation Drawer (Exact Screenshot Matching) */}
        {mobileOpen && (
          <div className="fixed inset-0 top-[88px] z-50 bg-white overflow-y-auto pb-24 shadow-2xl animate-fade-in border-t border-stone-200">
            <div className="max-w-md mx-auto px-5 py-5 space-y-6">
              
              {/* Top Section: SHOP ALL Header Link */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="font-extrabold text-xs tracking-widest uppercase text-stone-950 hover:text-stone-600 transition-colors"
                >
                  SHOP ALL
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
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

              {/* Promo Banner Card */}
              <div className="bg-stone-950 text-white p-4 rounded-sm relative overflow-hidden shadow-md flex items-center justify-between">
                <div className="space-y-1 max-w-[65%] z-10">
                  <div className="flex items-center space-x-1">
                    <span className="text-amber-400">🔥</span>
                    <span className="font-syne font-extrabold text-xs uppercase tracking-wider text-white">
                      BUY 2 GET 10% OFF
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-stone-400 tracking-widest uppercase">
                    LIMITED TIME OFFER
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center space-x-1 mt-2 bg-stone-900 border border-stone-700 hover:border-lime-400 text-white font-extrabold text-[9px] uppercase px-3 py-1.5 rounded-xs tracking-wider transition-all"
                  >
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-3 h-3 text-lime-400" />
                  </Link>
                </div>

                {/* Banner Mini Image Preview */}
                <div className="w-20 h-20 relative rounded-xs overflow-hidden border border-stone-800 flex-shrink-0">
                  <img
                    src="/products/farebi-olive.jpg"
                    alt="Promo Tee"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                </div>
              </div>

              {/* FEATURED COLLECTIONS SECTION */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400 border-b border-stone-100 pb-1.5">
                  FEATURED COLLECTIONS
                </h3>
                
                <div className="space-y-1 divide-y divide-stone-100/70">
                  
                  {/* New Arrivals */}
                  <Link
                    href="/shop?filter=new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-[9px]">
                        NEW
                      </div>
                      <div>
                        <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors">
                          NEW ARRIVALS
                        </h4>
                        <p className="text-[9px] text-stone-400 tracking-wide">Fresh Drops Every Week</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </Link>

                  {/* Best Sellers */}
                  <Link
                    href="/shop?filter=bestseller"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                        ⭐
                      </div>
                      <div>
                        <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors">
                          BEST SELLERS
                        </h4>
                        <p className="text-[9px] text-stone-400 tracking-wide">Our Most Loved Styles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </Link>

                  {/* Limited Edition */}
                  <Link
                    href="/shop?category=Limited+Edition"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">
                        🔥
                      </div>
                      <div>
                        <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors">
                          LIMITED EDITION
                        </h4>
                        <p className="text-[9px] text-stone-400 tracking-wide">Exclusive Drops</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </Link>

                  {/* Psychology Edition */}
                  <Link
                    href="/shop?category=Psychology+Edition"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                        🧠
                      </div>
                      <div>
                        <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors">
                          PSYCHOLOGY EDITION
                        </h4>
                        <p className="text-[9px] text-stone-400 tracking-wide">Mind & Identity Concepts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </Link>

                  {/* Anime Edition */}
                  <Link
                    href="/shop?category=Anime+Edition"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                        ⚔️
                      </div>
                      <div>
                        <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors">
                          ANIME EDITION
                        </h4>
                        <p className="text-[9px] text-stone-400 tracking-wide">Otaku & Street Culture</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </Link>

                  {/* All Collection */}
                  <Link
                    href="/shop"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center text-xs">
                        🛍️
                      </div>
                      <div>
                        <h4 className="font-syne font-extrabold text-xs uppercase tracking-wider text-stone-950 group-hover:text-stone-600 transition-colors">
                          ALL COLLECTION
                        </h4>
                        <p className="text-[9px] text-stone-400 tracking-wide">Explore All Streetwear Styles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
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

                  <Link
                    href="/shop?filter=new"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Flame className="w-4 h-4 text-rose-500" />
                      <span className="uppercase tracking-wider">New Drop</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>

                  <Link
                    href="/shop?price=under999"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4 text-amber-500" />
                      <span className="uppercase tracking-wider">Under ₹999</span>
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
              <div className="space-y-3 pt-2">
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
        )}

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
      
      {/* Spacer for fixed header */}
      <div className="h-24 sm:h-28 w-full" />
    </>
  );
}
