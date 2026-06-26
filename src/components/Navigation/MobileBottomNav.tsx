'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Home, Search, Flame, Heart, ShoppingBag } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart, wishlist } = useCart();
  const [activeSettings, setActiveSettings] = useState<any>({});

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_custom_settings');
      if (stored) {
        setActiveSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load settings in mobile bottom nav:', e);
    }
  }, []);

  // Hide on checkout and admin panels
  if (pathname?.startsWith('/checkout') || pathname?.startsWith('/admin')) {
    return null;
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const triggerCartOpen = () => {
    const event = new CustomEvent('open-cart');
    window.dispatchEvent(event);
  };

  const triggerSearchOpen = () => {
    const event = new CustomEvent('open-search');
    window.dispatchEvent(event);
  };

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/'
    },
    {
      label: 'Search',
      icon: Search,
      onClick: triggerSearchOpen
    },
    {
      label: 'Drops',
      icon: Flame,
      href: '/shop'
    },
    {
      label: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
      badge: wishlistCount
    },
    {
      label: 'Bag',
      icon: ShoppingBag,
      onClick: triggerCartOpen,
      badge: totalCartItems
    }
  ];

  // Determine dynamic classes based on background theme config
  const bgConfig = activeSettings?.general_config || {};
  const bgStyleVal = bgConfig.bg_style || 'default';
  const customBgColorVal = bgConfig.custom_bg_color || '#faf9f6';

  let navBgClass = 'bg-[#faf9f6]/95 backdrop-blur-md border-stone-200/60 text-stone-900';
  let activeColorClass = 'text-secondary fill-secondary/10';
  let inactiveColorClass = 'text-stone-600';
  let labelActiveColorClass = 'text-secondary';
  let labelInactiveColorClass = 'text-stone-500';

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
    navBgClass = 'bg-stone-950/95 backdrop-blur-md border-stone-900 text-white';
    activeColorClass = 'text-secondary fill-secondary/10';
    inactiveColorClass = 'text-stone-400';
    labelActiveColorClass = 'text-secondary';
    labelInactiveColorClass = 'text-stone-400';
  } else if (bgStyleVal === 'sepia') {
    navBgClass = 'bg-[#f4efe6]/95 backdrop-blur-md border-stone-350 text-stone-900';
    activeColorClass = 'text-secondary fill-secondary/10';
    inactiveColorClass = 'text-stone-600';
    labelActiveColorClass = 'text-secondary';
    labelInactiveColorClass = 'text-stone-500';
  } else if (bgStyleVal === 'custom-color') {
    if (isDark) {
      navBgClass = `border-stone-850 text-white`;
      activeColorClass = 'text-secondary fill-secondary/10';
      inactiveColorClass = 'text-stone-400';
      labelActiveColorClass = 'text-secondary';
      labelInactiveColorClass = 'text-stone-400';
    } else {
      navBgClass = `border-stone-200 text-stone-900`;
      activeColorClass = 'text-secondary fill-secondary/10';
      inactiveColorClass = 'text-stone-600';
      labelActiveColorClass = 'text-secondary';
      labelInactiveColorClass = 'text-stone-500';
    }
  }

  return (
    <div 
      className={`md:hidden fixed bottom-0 left-0 w-full border-t z-45 py-2 px-3 shadow-lg select-none ${navBgClass}`}
      style={{ backgroundColor: bgStyleVal === 'custom-color' ? customBgColorVal : undefined }}
    >
      <div className="flex justify-around items-center">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          const content = (
            <div className="flex flex-col items-center justify-center relative cursor-pointer py-1 px-3">
              <Icon className={`h-5 w-5 ${isActive ? activeColorClass : inactiveColorClass}`} />
              <span className={`text-[9px] mt-1 font-bold ${isActive ? labelActiveColorClass : labelInactiveColorClass}`}>
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-2 bg-sale text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {item.badge}
                </span>
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link key={index} href={item.href}>
                {content}
              </Link>
            );
          }

          return (
            <button key={index} onClick={item.onClick} className="focus:outline-none">
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
