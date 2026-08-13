'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Package,
  Truck,
  RotateCcw,
  Repeat,
  Ruler,
  CreditCard,
  Shirt,
  MessageCircle,
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqSection {
  key: string;
  title: string;
  icon: typeof Package;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    key: 'orders',
    title: 'Orders',
    icon: Package,
    items: [
      {
        q: 'How do I place an order?',
        a: 'Pick your size on the product page, hit Add to Bag or Buy Now, and follow the checkout steps. You’ll get an order confirmation by email and SMS once payment is complete.',
      },
      {
        q: 'Can I change or cancel my order after placing it?',
        a: 'Orders can be changed or cancelled within 2 hours of placing them, before they’re handed off for packing. Contact us immediately at support@arviik.com with your order number.',
      },
      {
        q: 'I didn’t get an order confirmation. What do I do?',
        a: 'Check your spam folder first. If it’s not there after 30 minutes, reach out via the Contact page with the email/phone used at checkout and we’ll verify it manually.',
      },
    ],
  },
  {
    key: 'shipping',
    title: 'Shipping',
    icon: Truck,
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Most orders are dispatched within 24-48 hours and delivered in 3-5 business days across India. Remote pin codes may take a little longer.',
      },
      {
        q: 'Is shipping free?',
        a: 'Yes — free shipping applies automatically on all prepaid orders above ₹1499. Orders below that, and COD orders, carry a small flat shipping fee shown at checkout.',
      },
      {
        q: 'Do you ship internationally?',
        a: 'Not yet — we currently ship only within India. International shipping is on the roadmap.',
      },
    ],
  },
  {
    key: 'returns',
    title: 'Returns',
    icon: RotateCcw,
    items: [
      {
        q: 'What is your return window?',
        a: 'You can request a return within 7 days of delivery, as long as the piece is unworn, unwashed, and has its original tags attached.',
      },
      {
        q: 'How do I start a return?',
        a: 'Go to Track Order or your Profile → Orders, select the item, and choose Return. A pickup will be scheduled from your delivery address at no extra cost.',
      },
      {
        q: 'When will I get my refund?',
        a: 'Refunds are processed within 5-7 business days after the returned item passes quality check at our warehouse, credited to your original payment method.',
      },
    ],
  },
  {
    key: 'exchanges',
    title: 'Exchanges',
    icon: Repeat,
    items: [
      {
        q: 'Can I exchange for a different size?',
        a: 'Yes — size exchanges are free within 7 days of delivery, subject to stock availability in the size you want.',
      },
      {
        q: 'Can I exchange for a different design?',
        a: 'Currently exchanges are limited to size changes on the same design. For a different design, please return the item and place a new order.',
      },
    ],
  },
  {
    key: 'sizes',
    title: 'Sizes',
    icon: Ruler,
    items: [
      {
        q: 'How does ARVIIK sizing run?',
        a: 'All ARVIIK pieces are tailored in a signature oversized boxy fit. Order your normal size for the intended oversized look, or size down for a more regular fit.',
      },
      {
        q: 'Is there a size chart?',
        a: 'Yes — every product page has a Size Guide link with chest, length, and shoulder measurements per size, plus a Find Size tool that recommends a size from your height and weight.',
      },
    ],
  },
  {
    key: 'payment',
    title: 'Payment',
    icon: CreditCard,
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'Cards, UPI, net banking, and popular wallets via Razorpay, plus Cash on Delivery on eligible orders.',
      },
      {
        q: 'Is it safe to pay on ARVIIK?',
        a: 'Yes — all payments are processed through Razorpay with bank-grade encryption. We never store your card details.',
      },
      {
        q: 'Do you offer any payment discounts?',
        a: 'Prepaid orders get 10% off automatically at checkout — COD orders don’t carry this discount.',
      },
    ],
  },
  {
    key: 'products',
    title: 'Products',
    icon: Shirt,
    items: [
      {
        q: 'What fabric do you use?',
        a: 'Heavyweight 240 GSM premium combed cotton across the collection — bio-washed, pre-shrunk, and softened for a lived-in feel from day one.',
      },
      {
        q: 'How should I wash my ARVIIK piece?',
        a: 'Machine wash cold, inside out, with like colors. Avoid ironing directly on screen-printed graphics, and skip high-heat tumble drying — hang dry in shade instead.',
      },
      {
        q: 'Will you restock sold-out sizes?',
        a: 'Limited Edition drops don’t restock once sold out. Core styles are restocked periodically — use the notify option on the product page to get an alert.',
      },
    ],
  },
];

export default function FaqPage() {
  const [activeSection, setActiveSection] = useState(FAQ_SECTIONS[0].key);
  const [openItem, setOpenItem] = useState<string | null>(`${FAQ_SECTIONS[0].key}-0`);

  const section = FAQ_SECTIONS.find((s) => s.key === activeSection)!;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          We&apos;ve Got Answers
        </span>
        <h1 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium">
          Everything about orders, shipping, returns, sizing and more.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10">
        {/* Category nav */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {FAQ_SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.key === activeSection;
            return (
              <button
                key={s.key}
                onClick={() => {
                  setActiveSection(s.key);
                  setOpenItem(`${s.key}-0`);
                }}
                className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left text-xs font-extrabold uppercase tracking-wider transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Q&A list */}
        <div className="space-y-2.5">
          {section.items.map((item, i) => {
            const id = `${section.key}-${i}`;
            const open = openItem === id;
            return (
              <div
                key={id}
                className="border border-stone-200/80 rounded-xl overflow-hidden bg-white"
              >
                <button
                  onClick={() => setOpenItem(open ? null : id)}
                  className="w-full p-4 flex justify-between items-center gap-3 text-left hover:bg-stone-50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-stone-900">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Still need help */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-stone-50/80 border border-stone-200/80 rounded-xl text-center sm:text-left">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-stone-700 flex-shrink-0" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-stone-900">Still need help?</p>
            <p className="text-[11px] text-stone-500 font-medium">Our support team usually replies within a few hours.</p>
          </div>
        </div>
        <Link
          href="/contact"
          className="flex-shrink-0 inline-flex items-center bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest px-6 py-3 rounded-xl transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
