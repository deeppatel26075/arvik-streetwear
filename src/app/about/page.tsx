import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Feather, Layers, Users, ShieldCheck } from 'lucide-react';

const VALUES = [
  {
    icon: Feather,
    title: 'Design With Intent',
    text: 'Every graphic, cut and colorway starts as a concept, not a template. If it doesn’t say something, it doesn’t ship.',
  },
  {
    icon: Layers,
    title: 'Quality Over Quantity',
    text: '240 GSM heavyweight cotton, bio-washed and pre-shrunk. Fewer drops, built to actually survive them.',
  },
  {
    icon: Users,
    title: 'Culture, Not Just Clothing',
    text: 'Every edition is rooted in a mindset: chaos, psychology, rebellion, worn by people who relate to the idea, not just the fit.',
  },
  {
    icon: ShieldCheck,
    title: 'Made To Last',
    text: 'Boxy silhouettes and prints engineered to hold their shape and color wash after wash, not just on day one.',
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-stone-950 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/products/mard-paisa-maroon.jpg"
            alt=""
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-950/40" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center space-y-4">
          <span className="text-[10px] text-lime-400 font-extrabold tracking-[0.35em] uppercase block">
            The ARVIIK Manifesto
          </span>
          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl uppercase tracking-wider text-white leading-none">
            Wear Your Identity
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-lg mx-auto leading-relaxed pt-2">
            ARVIIK does the thinking, designing, experimenting, sourcing and refining. The customer
            simply chooses the piece that feels like them.
          </p>
        </div>
      </section>

      {/* Why ARVIIK Exists */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-4">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          Why ARVIIK Exists
        </span>
        <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
          Streetwear Should Say Something
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
          Most oversized tees are just fabric with a logo on it. ARVIIK started because we wanted
          the opposite, pieces that carried an actual idea. Limited Edition, On Fire, Graphic Tee,
          Hidden Patterns, every collection is a different headspace, not just a different print.
          We obsess over 240 GSM combed cotton, drop-shoulder cuts, and screen prints that survive
          real washes, so the piece still means something a year in.
        </p>
      </section>

      {/* Visual storytelling collage */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative col-span-1 row-span-2 aspect-3/5 md:aspect-auto rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80">
            <Image src="/products/farebi-olive.jpg" alt="ARVIIK craft" fill className="object-cover" />
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80">
            <Image src="/products/polarize-navy.jpg" alt="ARVIIK craft" fill className="object-cover" />
          </div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80">
            <Image src="/products/polarize-cream.jpg" alt="ARVIIK craft" fill className="object-cover" />
          </div>
          <div className="relative col-span-2 md:col-span-1 md:row-span-2 aspect-3/2 md:aspect-auto rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80">
            <Image src="/products/mard-paisa-maroon.jpg" alt="ARVIIK craft" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="bg-stone-50 border-y border-stone-200/60 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
              What We Stand For
            </span>
            <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
              Brand Values
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="p-5 bg-white border border-stone-200/80 rounded-xl space-y-3"
                >
                  <div className="h-10 w-10 rounded-full bg-stone-950 flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-lime-400" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                    {v.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{v.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-5">
        <h2 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-950">
          Ready To Wear Your Identity?
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 bg-stone-950 hover:bg-stone-900 text-white text-xs font-extrabold uppercase tracking-widest px-8 py-4 rounded-xl transition-colors"
        >
          <span>Shop The Collection</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
