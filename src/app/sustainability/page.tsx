import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Layers, Timer, Droplets, Thermometer, Shirt, Wind, Ban, Repeat } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sustainability | ARVIIK',
  description:
    'Made to be kept. Heavyweight 240 GSM cotton, fewer considered drops, and a care guide to make every ARVIIK piece last.',
};

// NOTE FOR EDITORS: keep every claim on this page something ARVIIK can back
// up. Don't add "organic", "eco", "carbon neutral" or certification claims
// unless there is documentation for them.

const PILLARS = [
  {
    icon: Timer,
    kicker: '01',
    title: 'Fewer, Considered Drops',
    text: 'We release in editions, not endless restocks. Every design has to earn its place before it is produced, so less ends up unsold or unworn.',
  },
  {
    icon: Layers,
    kicker: '02',
    title: 'Heavyweight Lasts Longer',
    text: '240 GSM combed cotton holds its shape, its collar and its print far longer than a thin fast-fashion tee. Built to be worn for years, not a season.',
  },
  {
    icon: Repeat,
    kicker: '03',
    title: 'Finished Before It Reaches You',
    text: 'Every piece is bio-washed and pre-shrunk, so the fit you order is the fit you keep. No tee retired early because it shrank after the first wash.',
  },
];

const CARE = [
  { icon: Shirt, title: 'Inside Out', text: 'Turn it inside out before washing to protect the print.' },
  { icon: Thermometer, title: 'Wash Cold', text: 'Cold or 30°C keeps the cotton and colour strong, and uses less energy.' },
  { icon: Droplets, title: 'Gentle Cycle', text: 'Mild detergent, no bleach. Wash with similar colours.' },
  { icon: Wind, title: 'Air Dry', text: 'Dry flat or on a hanger in the shade. Skip the high-heat tumble dryer.' },
  { icon: Ban, title: 'Never Iron The Print', text: 'Iron inside out on low heat, and never directly on the graphic.' },
];

export default function SustainabilityPage() {
  return (
    <div>
      {/* Hero — typographic, built around the fabric weight */}
      <section className="relative bg-stone-950 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <span
            className="font-syne font-extrabold leading-none text-transparent text-[33vw] sm:text-[30vw] lg:text-[22rem] tracking-tighter"
            style={{ WebkitTextStroke: '1px rgba(163, 230, 53, 0.3)' }}
          >
            240
          </span>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(12,10,9,0.85)_80%)]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center space-y-5">
          <span className="text-[10px] text-lime-400 font-extrabold tracking-[0.35em] uppercase block">
            Sustainability
          </span>
          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl uppercase tracking-wider text-white leading-[0.95]">
            Made To Be Kept
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-md mx-auto leading-relaxed">
            The most sustainable tee is the one you never have to replace. So we build ours to stay
            in your rotation for years, not a season.
          </p>
        </div>
      </section>

      {/* The idea */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-4">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          Our Approach
        </span>
        <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
          Buy Less. Wear It Longer.
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
          Fast fashion makes clothes that are meant to be thrown away. We would rather make fewer
          pieces, make them properly, and help you keep them looking right. That starts with how
          they are made, and continues with how they are cared for.
        </p>
      </section>

      {/* Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="relative p-6 sm:p-7 bg-stone-950 text-white rounded-2xl overflow-hidden space-y-4"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-4 font-syne font-extrabold text-7xl text-white/[0.05] leading-none"
                >
                  {p.kicker}
                </span>
                <div className="h-10 w-10 rounded-full border border-lime-400/40 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-lime-400" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">{p.title}</h3>
                <p className="text-[12px] text-stone-400 leading-relaxed font-medium">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Care guide */}
      <section className="bg-stone-50 border-y border-stone-200/60 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              The Part You Control
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
              Make It Last
            </h2>
            <p className="text-xs text-stone-500 font-medium max-w-md mx-auto leading-relaxed">
              Most of a garment&apos;s life happens after it leaves us. Five habits that keep your
              ARVIIK piece looking new for longer.
            </p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CARE.map((c, i) => {
              const Icon = c.icon;
              return (
                <li
                  key={c.title}
                  className="p-5 bg-white border border-stone-200/80 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-full bg-stone-950 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-lime-400" />
                    </div>
                    <span className="text-[10px] font-extrabold text-stone-300 tracking-widest">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                    {c.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{c.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Honest note */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="border-l-2 border-lime-400 pl-5 sm:pl-7 space-y-3">
          <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
            An Honest Note
          </span>
          <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-medium">
            We&apos;re a young label, and we won&apos;t stick words like &ldquo;eco&rdquo; on anything
            we can&apos;t prove. What we can promise is clothing made to last, and to keep improving
            how we make it. When something changes, you&apos;ll read about it here first.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-950 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-white">
            Pieces Worth Keeping
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 bg-white hover:bg-stone-200 text-stone-950 text-xs font-extrabold uppercase tracking-widest px-8 py-4 rounded-xl transition-colors"
            >
              <span>Shop The Collection</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center text-xs font-extrabold uppercase tracking-widest text-stone-300 hover:text-white px-6 py-4 transition-colors"
            >
              Questions about our materials?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
