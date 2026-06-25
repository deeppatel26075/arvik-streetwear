'use client';

import React from 'react';
import Link from 'next/link';
import { X, Heart, User, MapPin, Package, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function MobileMenu({ isOpen, onClose, isAdmin }: MobileMenuProps) {
  if (!isOpen) return null;

  const links = [
    { label: 'New Drops', href: '/shop?tag=NEW+ARRIVAL' },
    { label: 'Oversized Tees', href: '/shop' },
    { label: 'Graphic Prints', href: '/shop?category=Graphic+Prints' },
    { label: 'Minimalist Typo', href: '/shop?category=Minimalist+Typo' },
    { label: 'Plus Size Fit', href: '/shop?category=Plus+Size' },
    { label: 'Bestsellers', href: '/shop?tag=BESTSELLER' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-950/50 backdrop-blur-md z-50 flex justify-end lg:hidden"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto"
      >
        {/* Header inside drawer */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
          <span className="font-syne font-extrabold text-lg tracking-[0.2em] text-stone-900 logo-retro px-1">
            ARVIIK
          </span>
          <button onClick={onClose} className="p-2 text-stone-600 hover:text-stone-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col space-y-4 text-lg font-extrabold tracking-wider uppercase border-b border-stone-100 pb-6 mb-6">
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={onClose}
              className="hover:text-secondary hover:underline transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Account / Actions Section */}
        <div className="flex flex-col space-y-4 text-xs font-bold uppercase tracking-widest text-stone-750">
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center space-x-3 hover:text-secondary py-1"
          >
            <Heart className="h-4.5 w-4.5 text-stone-500" />
            <span>My Wishlist</span>
          </Link>

          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center space-x-3 hover:text-secondary py-1"
          >
            <User className="h-4.5 w-4.5 text-stone-500" />
            <span>My Account</span>
          </Link>

          <Link
            href="/track-order"
            onClick={onClose}
            className="flex items-center space-x-3 hover:text-secondary py-1"
          >
            <Package className="h-4.5 w-4.5 text-stone-500" />
            <span>Track Order</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center space-x-3 text-sale hover:opacity-85 py-1"
            >
              <MapPin className="h-4.5 w-4.5 text-sale" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-auto border-t border-stone-100 pt-6 text-[10px] text-stone-400 font-bold uppercase tracking-wider text-center">
          <p>© ARVIIK CLOTHING CO.</p>
          <p className="mt-1">WEAR YOUR IDENTITY</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
