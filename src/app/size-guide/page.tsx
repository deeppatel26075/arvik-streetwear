import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Ruler, MoveHorizontal, MoveVertical, Shirt } from 'lucide-react';
import { SIZE_CHART, inchesToCm } from '@/lib/sizeChart';

export const metadata: Metadata = {
  title: 'Size Guide | ARVIIK',
  description:
    'Chest, length and shoulder measurements for every ARVIIK oversized tee, in inches and centimetres, plus how to pick your size.',
};

const HOW_TO_MEASURE = [
  {
    icon: MoveHorizontal,
    title: 'Chest',
    text: 'Lay the tee flat and measure straight across from armpit to armpit, then double it.',
  },
  {
    icon: MoveVertical,
    title: 'Length',
    text: 'From the highest point of the shoulder, next to the collar, straight down to the hem.',
  },
  {
    icon: Ruler,
    title: 'Shoulder',
    text: 'Straight across the back, from one shoulder seam to the other.',
  },
];

export default function SizeGuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-[10px] text-stone-400 font-extrabold tracking-[0.3em] uppercase block">
          Find Your Fit
        </span>
        <h1 className="font-syne font-extrabold text-2xl sm:text-3xl uppercase tracking-wider text-stone-950">
          Size Guide
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-md mx-auto leading-relaxed">
          Every ARVIIK tee is cut in our signature oversized, boxy fit. Order your normal size for the
          oversized look, or size down for a more regular fit.
        </p>
      </div>

      {/* Chart */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-stone-500">
            Garment Measurements
          </h2>
          <span className="text-[10px] font-bold text-stone-400">inches / cm</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-950 text-[10px] text-white font-extrabold uppercase tracking-wider">
                <th scope="col" className="px-3 sm:px-4 py-3">Size</th>
                <th scope="col" className="px-3 sm:px-4 py-3">Chest</th>
                <th scope="col" className="px-3 sm:px-4 py-3">Length</th>
                <th scope="col" className="px-3 sm:px-4 py-3">Shoulder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-700">
              {SIZE_CHART.map((r) => (
                <tr key={r.size} className="even:bg-stone-50/70">
                  <th scope="row" className="px-3 sm:px-4 py-3.5 font-extrabold text-stone-950 text-sm">
                    {r.size}
                  </th>
                  {[r.chest, r.length, r.shoulder].map((inches, i) => (
                    <td key={i} className="px-3 sm:px-4 py-3.5">
                      <span className="font-bold text-stone-900">{inches}&quot;</span>
                      <span className="block sm:inline sm:ml-1.5 text-[10px] text-stone-400">
                        {inchesToCm(inches)} cm
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-stone-400 font-medium">
          Measurements are of the garment laid flat, not body measurements. Allow a small tolerance of about
          half an inch.
        </p>
      </section>

      {/* How to measure */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-stone-500">
          How To Measure
        </h2>
        <p className="text-xs text-stone-500 font-medium leading-relaxed">
          The easiest way to choose: take a tee you already love the fit of, lay it flat, and compare it with
          the chart above.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HOW_TO_MEASURE.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="p-5 bg-stone-50 border border-stone-200/80 rounded-xl space-y-2.5">
                <div className="h-9 w-9 rounded-full bg-stone-950 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-lime-400" />
                </div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900">{m.title}</h3>
                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{m.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fit tip + CTA */}
      <section className="p-6 sm:p-8 bg-stone-950 rounded-2xl text-center space-y-4">
        <Shirt className="h-6 w-6 text-lime-400 mx-auto" />
        <h2 className="font-syne font-extrabold text-lg sm:text-xl uppercase tracking-wider text-white">
          Still Not Sure?
        </h2>
        <p className="text-xs text-stone-400 font-medium max-w-sm mx-auto leading-relaxed">
          Every product page has a <strong className="text-white">Find Size</strong> tool that recommends a
          size from your height and weight. And if it&apos;s not quite right, you can exchange for a different
          size within 7 days of delivery.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-white hover:bg-stone-200 text-stone-950 text-xs font-extrabold uppercase tracking-widest px-7 py-3.5 rounded-xl transition-colors"
        >
          <span>Shop The Collection</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
