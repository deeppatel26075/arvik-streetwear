'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ChevronDown } from 'lucide-react';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({ eyebrow, title, intro, lastUpdated, sections }: LegalPageLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          {eyebrow}
        </span>
        <h1 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">{intro}</p>
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider pt-1">
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Mobile: jump-to dropdown */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs font-extrabold uppercase tracking-wider text-stone-900"
        >
          <span>Jump to a section</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileNavOpen && (
          <div className="mt-1.5 border border-stone-200/80 rounded-xl overflow-hidden bg-white divide-y divide-stone-100">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">
        {/* Desktop sticky TOC */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block mb-2 px-2">
              On this page
            </span>
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-950 hover:bg-stone-50 transition-colors"
              >
                <span className="text-stone-400 font-mono mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 space-y-3">
              <h2 className="font-syne font-extrabold text-base sm:text-lg uppercase tracking-wider text-stone-950 flex items-baseline gap-2.5 pb-2 border-b border-stone-200">
                <span className="text-stone-300 font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              <div className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium space-y-3 [&_strong]:text-stone-900 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-stone-900 [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-2">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-stone-50/80 border border-stone-200/80 rounded-xl text-center sm:text-left">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-stone-700 flex-shrink-0" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-stone-900">Questions about this policy?</p>
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
