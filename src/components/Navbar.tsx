'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Menu,
  X,
  Home,
  Search,
  LogOut,
  ShoppingBag,
  Heart,
  User,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  Tag,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Truck,
  Shirt,
  ArrowUpRight
} from 'lucide-react';

const TRENDING_SEARCHES = ['Oversized Tees', 'New Arrivals', 'On Fire', 'Limited Edition'];
const RECENT_SEARCHES_KEY = 'arviik_recent_searches';
const PROMO_MESSAGES = [
  'FREE SHIPPING ACROSS INDIA ON ORDERS ABOVE ₹1499',
  '10% OFF ON ALL PREPAID ORDERS',
];
// The marquee track is two of these back-to-back, translated by exactly
// -50% on an infinite loop — that's only seamless if each half is at
// least as wide as the widest screen it renders on. Repeating the message
// list several times per half keeps each half comfortably wider than any
// real viewport (including ultra-wide monitors), so there's never a run
// of empty track visible between the last message and the loop restart.
const MARQUEE_MESSAGES = Array(6).fill(PROMO_MESSAGES).flat();

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, wishlist } = useCart();
  const { user, profile, signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCatalog, setSearchCatalog] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        accountBtnRef.current && !accountBtnRef.current.contains(target) &&
        accountPanelRef.current && !accountPanelRef.current.contains(target)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [accountMenuOpen]);

  const handleSignOut = async () => {
    setAccountMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    router.push('/');
  };

  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      setHeaderHeight(height);
      // Exposed as a CSS var so other pages (e.g. the shop page's sticky
      // filter bar) can position themselves right below the header
      // without duplicating this ResizeObserver.
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_hidden', false)
      .then(({ data }: { data: any[] | null }) => {
        if (cancelled || !data) return;
        setSearchCatalog(data.map((p) => ({ id: p.id, name: p.name, slug: p.slug })));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return searchCatalog.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 6);
  }, [searchQuery, searchCatalog]);

  // Once search is no longer visible (closed via the X, a nav link, clicking
  // a suggestion, or submitting), clear whatever was typed so it doesn't
  // linger the next time search is opened.
  useEffect(() => {
    if (!searchOpen && !mobileOpen) {
      setSearchQuery('');
    }
  }, [searchOpen, mobileOpen]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  const persistRecentSearches = (list: string[]) => {
    setRecentSearches(list);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    } catch {}
  };

  const addRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    persistRecentSearches(
      [trimmed, ...recentSearches.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5)
    );
  };

  const removeRecentSearch = (term: string) => {
    persistRecentSearches(recentSearches.filter((t) => t !== term));
  };

  const clearAllRecentSearches = () => {
    persistRecentSearches([]);
  };

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
      addRecentSearch(searchQuery);
      router.push(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (slug: string) => {
    router.push(`/shop/${slug}`);
    setSearchOpen(false);
    setMobileOpen(false);
    setSearchQuery('');
  };

  const runQuickSearch = (term: string) => {
    addRecentSearch(term);
    router.push(`/shop?query=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 w-full max-w-full overflow-x-hidden z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-stone-200/40 select-none"
      >
        {/* Top Announcement Bar — a continuously-scrolling marquee. The
            message sequence is rendered twice back-to-back; the track is
            translated exactly -50% (its own width) on an infinite loop, so
            the moment the first copy scrolls fully offscreen the second
            copy is in the exact same position, making the loop seamless. */}
        <div className="bg-stone-950 text-lime-400 py-2 overflow-hidden border-b border-stone-900/10 text-[9px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] select-none">
          <div className="animate-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center shrink-0">
                {MARQUEE_MESSAGES.map((msg, i) => (
                  <span key={`${copy}-${i}`} className="flex items-center whitespace-nowrap pl-6">
                    <span className="mr-6" aria-hidden="true">⚡</span>
                    {msg}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Navbar Header — full-width (no max-w cap) so the hamburger
            and the icon cluster sit at the true screen edges rather than
            being inset by the centered 1440px content column used lower
            down the page. */}
        <div className="w-full px-4 sm:px-6 lg:px-8 transition-all duration-300 py-4">
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
                className="font-syne font-extrabold text-xl sm:text-3xl tracking-[0.12em] sm:tracking-[0.25em] text-stone-900 transition-opacity hover:opacity-85"
              >
                ARVIIK
              </Link>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-2.5 sm:space-x-5">
              <Link
                href="/"
                className="text-stone-900 hover:opacity-70 transition-opacity p-1"
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
              </Link>

              <button
                onClick={() => setSearchOpen((prev) => !prev)}
                className="text-stone-900 hover:opacity-70 transition-opacity p-1"
                aria-label={searchOpen ? 'Close search' : 'Search'}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
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

              {user ? (
                <button
                  ref={accountBtnRef}
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  className="hidden sm:inline-flex text-stone-900 hover:opacity-70 transition-opacity p-1"
                  aria-label="Account menu"
                  aria-expanded={accountMenuOpen}
                >
                  <User className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-stone-900 hover:opacity-70 transition-opacity p-1"
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </Link>
              )}

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

        {/* Inline Search Bar — slides open directly from the navbar instead
            of a popup modal/overlay. Always mounted (max-height/opacity
            animated) so the transition is smooth and the input can be
            focus-managed via ref. */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            searchOpen ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-5">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2.5 bg-stone-100 rounded-lg px-3.5 py-2.5"
            >
              <Search className="h-4.5 w-4.5 text-stone-500 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                tabIndex={searchOpen ? 0 : -1}
                className="flex-grow bg-transparent border-none outline-none text-sm sm:text-base text-stone-900 placeholder:text-stone-500"
              />
            </form>
          </div>
        </div>
      </header>

      {/* Account Dropdown — floats below the header as a sibling, not a
          descendant, for the same reason the search dropdown below does:
          the header sets `overflow-x-hidden`, which per the CSS overflow
          spec forces its computed overflow-y to 'auto' too, clipping any
          nested content that visually extends past the header's own box. */}
      {accountMenuOpen && user && (
        <div className="fixed left-0 right-0 z-50 pointer-events-none" style={{ top: headerHeight }}>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
            <div
              ref={accountPanelRef}
              className="pointer-events-auto mt-2.5 w-52 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden animate-fade-in"
            >
              <Link
                href="/account"
                onClick={() => setAccountMenuOpen(false)}
                className="block px-4 py-3 border-b border-stone-100 hover:bg-stone-50 transition-colors"
              >
                <p className="text-xs font-bold text-stone-900 uppercase tracking-wide truncate">
                  {profile?.full_name || 'Account'}
                </p>
                {user.email && (
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">{user.email}</p>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Dropdown — floats below the header (outside it so it isn't
          clipped by the header's own overflow/backdrop-blur stacking
          context). Shows recent/trending searches when the box is empty,
          live product suggestions once the visitor starts typing. */}
      {searchOpen && (searchQuery.trim() ? searchSuggestions.length > 0 : true) && (
        <div className="fixed left-0 right-0 z-30 pointer-events-none" style={{ top: headerHeight }}>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pointer-events-auto bg-white border border-stone-200 rounded-b-lg shadow-lg max-h-[70vh] overflow-y-auto">
              {searchQuery.trim() ? (
                searchSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSuggestionClick(p.slug)}
                    className="w-full flex items-center space-x-2.5 py-2.5 px-4 hover:bg-stone-50 transition-colors text-left"
                  >
                    <Search className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
                    <span className="font-syne font-extrabold text-xs uppercase text-stone-950 tracking-wider">{p.name}</span>
                  </button>
                ))
              ) : (
                <div className="p-4 space-y-5">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecentSearches}
                          className="text-[10px] font-semibold text-stone-500 underline hover:text-stone-900 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div>
                        {recentSearches.map((term) => (
                          <div key={term} className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => runQuickSearch(term)}
                              className="flex-grow text-left py-2 text-sm text-stone-800 hover:text-stone-950 transition-colors"
                            >
                              {term}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRecentSearch(term)}
                              className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                              aria-label={`Remove ${term} from recent searches`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 block mb-1.5">
                      Trending Searches
                    </span>
                    <div>
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => runQuickSearch(term)}
                          className="w-full flex items-center justify-between py-2 text-sm text-stone-800 hover:text-stone-950 transition-colors text-left"
                        >
                          <span>{term}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hamburger Menu Drawer Overlay — outside header so z-index is not capped by header's stacking context */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99999] flex justify-start animate-fade-in">
          {/* Backdrop — closes the menu when a user taps outside the
              drawer panel (e.g. on wider screens where the panel doesn't
              span the full viewport width). */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-md bg-white h-full min-h-screen overflow-y-auto p-6 shadow-2xl flex flex-col justify-between space-y-6 border-r border-stone-200">
            
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

                  {searchSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-stone-200 rounded-sm shadow-lg max-h-72 overflow-y-auto z-10">
                      {searchSuggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSuggestionClick(p.slug)}
                          className="w-full flex items-center space-x-2.5 py-2.5 px-3 hover:bg-stone-50 transition-colors text-left"
                        >
                          <Search className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
                          <span className="font-syne font-extrabold text-xs uppercase text-stone-950 tracking-wider">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
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
                    href="/shop?category=On+Fire"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Zap className="w-4 h-4 text-stone-500" />
                      <span className="uppercase tracking-wider">On Fire</span>
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
                      <span className="uppercase tracking-wider">Hidden Patterns</span>
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
                    href={user ? "/account" : "/login"}
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xs transition-colors group"
                  >
                    <User className="w-4 h-4 text-stone-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                      My Account
                    </span>
                  </Link>

                  <Link
                    href="/track-order"
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xs transition-colors group"
                  >
                    <Truck className="w-4 h-4 text-stone-700 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-800">
                      Track Order
                    </span>
                  </Link>

                  <Link
                    href="/faq"
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
                    href="/faq"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center space-x-3 py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <Tag className="w-4 h-4 text-stone-600" />
                    <span className="uppercase tracking-wider">FAQ</span>
                  </Link>

                  <Link
                    href="/about"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center space-x-3 py-2 px-2 hover:bg-stone-50 rounded-xs transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-stone-600" />
                    <span className="uppercase tracking-wider">About ARVIIK</span>
                  </Link>

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
