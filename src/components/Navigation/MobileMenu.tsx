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
        <div className="flex items-center justify-between border-b border-stone-200/40 pb-4 mb-6">
          <span className="font-serif font-light text-lg tracking-[0.25em] text-stone-900 px-1">
            ARVIIK
          </span>
          <button onClick={onClose} className="p-2 text-stone-600 hover:text-stone-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col space-y-4 text-xs font-semibold tracking-[0.2em] uppercase border-b border-stone-200/40 pb-6 mb-6">
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={onClose}
              className="hover:text-secondary transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Account / Actions Section */}
        <div className="flex flex-col space-y-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-600">
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center space-x-3 hover:text-stone-900 py-1"
          >
            <Heart className="h-4 w-4 text-stone-400" />
            <span>My Wishlist</span>
          </Link>

          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center space-x-3 hover:text-stone-900 py-1"
          >
            <User className="h-4 w-4 text-stone-400" />
            <span>My Account</span>
          </Link>

          <Link
            href="/track-order"
            onClick={onClose}
            className="flex items-center space-x-3 hover:text-stone-900 py-1"
          >
            <Package className="h-4 w-4 text-stone-400" />
            <span>Track Order</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center space-x-3 text-sale hover:opacity-85 py-1"
            >
              <MapPin className="h-4 w-4 text-sale" />
              <span>Admin Dashboard</span>
            </Link>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-auto border-t border-stone-200/40 pt-6 text-[8px] text-stone-400 font-semibold uppercase tracking-[0.25em] text-center font-sans">
          <p>© ARVIIK CLOTHING CO.</p>
          <p className="mt-1 font-light text-stone-300">WEAR YOUR IDENTITY</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
