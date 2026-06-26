'use client';

import React from 'react';
import Link from 'next/link';

interface MegaMenuProps {
  onClose?: () => void;
}

export default function MegaMenu({ onClose }: MegaMenuProps) {
  const sections = [
    {
      title: 'SHOP BY FIT',
      links: [
        { label: 'Oversized Tees', href: '/shop' },
        { label: 'Plus Size Fit', href: '/shop?category=Plus+Size' }
      ]
    },
    {
      title: 'SHOP BY STYLE',
      links: [
        { label: 'Graphic Prints', href: '/shop?category=Graphic+Prints' },
        { label: 'Minimalist Typo', href: '/shop?category=Minimalist+Typo' }
      ]
    },
    {
      title: 'SHOP BY DROP',
      links: [
        { label: 'New Drops', href: '/shop?tag=NEW+ARRIVAL' },
        { label: 'Bestsellers', href: '/shop?tag=BESTSELLER' }
      ]
    }
  ];

  const thumbnails = [
    {
      name: 'Graphic Signature Tee',
      img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=400',
      price: '₹899',
      href: '/shop'
    },
    {
      name: 'Minimalist Typo Tee',
      img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400',
      price: '₹899',
      href: '/shop'
    }
  ];

  return (
    <div className="absolute top-full left-0 w-full bg-white border-b border-stone-200/40 shadow-luxury py-10 px-8 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        {/* Navigation Categories */}
        <div className="col-span-8 grid grid-cols-3 gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="font-sans font-semibold text-[10px] tracking-[0.2em] text-stone-900 border-b border-stone-200/40 pb-2">
                {section.title}
              </h4>
              <ul className="space-y-2 text-[11px] text-stone-500 tracking-wider font-sans">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="hover:text-secondary transition-all block font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Highlight Thumbnails */}
        <div className="col-span-4 border-l border-stone-200/40 pl-8 grid grid-cols-2 gap-4">
          {thumbnails.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={onClose}
              className="group flex flex-col space-y-2 relative"
            >
              <div className="aspect-3/4 w-full bg-stone-50 rounded-none overflow-hidden relative border border-stone-200/40">
                <img
                  src={item.img}
                  alt={item.name}
                  className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col text-[9px] uppercase font-semibold text-stone-900 tracking-[0.15em] font-sans">
                <span className="line-clamp-1">{item.name}</span>
                <span className="text-secondary mt-0.5">{item.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
