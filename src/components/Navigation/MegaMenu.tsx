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
      name: 'Farebi Olive Tee',
      img: '/products/farebi-olive.jpg',
      price: '₹599',
      href: '/shop/farebi-oversized-olive-tee'
    },
    {
      name: 'Cream polarize',
      img: '/products/polarize-cream.jpg',
      price: '₹599',
      href: '/shop/polarize-vintage-cream-tee'
    }
  ];

  return (
    <div className="absolute top-full left-0 w-full bg-white border-b border-stone-200 shadow-xl py-8 px-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        {/* Navigation Categories */}
        <div className="col-span-8 grid grid-cols-3 gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="font-syne font-extrabold text-[11px] tracking-[0.2em] text-stone-900 border-b border-stone-100 pb-2">
                {section.title}
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-600">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="hover:text-secondary hover:underline transition-all block font-semibold"
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
        <div className="col-span-4 border-l border-stone-100 pl-8 grid grid-cols-2 gap-4">
          {thumbnails.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              onClick={onClose}
              className="group flex flex-col space-y-2 relative"
            >
              <div className="aspect-3/4 w-full bg-stone-100 rounded-sm overflow-hidden relative border border-stone-150">
                <img
                  src={item.img}
                  alt={item.name}
                  className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-sale text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm">
                  Trending
                </span>
              </div>
              <div className="flex flex-col text-[10px] uppercase font-bold text-stone-900 tracking-wider">
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
