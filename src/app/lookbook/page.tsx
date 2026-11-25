import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { supabase, withTimeout } from '@/lib/supabase';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Lookbook | ARVIIK',
  description: 'The ARVIIK lookbook. Every piece from the current drop, shot and styled.',
};

interface LookRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  product_images?: { image_url: string }[] | null;
}

// One short line of copy per look, taken from the product's own description.
// Descriptions can carry hidden admin data (<!--color:…-->), stripped here;
// a caption that only repeats the product name is dropped.
function caption(text: string | null | undefined, name: string): string {
  const clean = (text || '').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length < 20 || clean.toLowerCase() === name.toLowerCase()) return '';
  const first = clean.split(/(?<=[.!?])\s/)[0].trim();
  return first.length > 140 ? first.slice(0, 137).trimEnd() + '…' : first;
}

export default async function LookbookPage() {
  const res = await withTimeout<{ data: LookRow[] | null; error: unknown }>(
    supabase
      .from('products')
      .select('id, name, slug, description, price, discount_price, product_images(image_url)')
      .eq('is_hidden', false).not('slug', 'like', 'custom-tee%')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: LookRow[] | null; error: unknown }>
  );
  if (!res || res.error) throw new Error('Lookbook: failed to load products');

  const looks = (res.data || []).filter((p) => p.product_images?.[0]?.image_url);

  return (
    <div className="bg-stone-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(163,230,53,0.12),transparent_60%)]" />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 pt-20 pb-14 sm:pt-28 sm:pb-20">
          <span className="text-[10px] text-lime-400 font-extrabold tracking-[0.35em] uppercase block">
            Lookbook
          </span>
          <h1 className="mt-4 font-syne font-extrabold text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tight leading-[0.9]">
            Wear Your
            <br />
            <span className="text-stone-500">Identity.</span>
          </h1>
          <p className="mt-6 max-w-md text-xs sm:text-sm text-stone-400 leading-relaxed">
            Every piece from the current drop, shot the way it is meant to be worn. Heavyweight 240 GSM cotton,
            oversized and built to last.
          </p>
        </div>
      </section>

      {/* Looks */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 pb-20 space-y-16 sm:space-y-28">
        {looks.map((look, i) => {
          const price = look.discount_price || look.price;
          const flip = i % 2 === 1;
          return (
            <article
              key={look.id}
              className={`grid md:grid-cols-12 gap-6 md:gap-10 items-end ${flip ? 'md:[&>*:first-child]:order-2' : ''}`}
            >
              <Link
                href={`/shop/${look.slug}`}
                className={`group relative block overflow-hidden rounded-2xl bg-stone-900 aspect-[4/5] ${
                  i === 0 ? 'md:col-span-8' : 'md:col-span-7'
                }`}
              >
                <Image
                  src={look.product_images![0].image_url}
                  alt={`${look.name} by ARVIIK`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 767px) 100vw, 60vw"
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-white/90 text-stone-950 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>

              <div className={`${i === 0 ? 'md:col-span-4' : 'md:col-span-5'} space-y-4 md:pb-6`}>
                <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-lime-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                  Look
                </span>
                <h2 className="font-syne font-extrabold text-3xl sm:text-5xl uppercase tracking-tight leading-none">
                  {look.name}
                </h2>
                {caption(look.description, look.name) && (
                  <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-sm">{caption(look.description, look.name)}</p>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <Link
                    href={`/shop/${look.slug}`}
                    className="inline-flex items-center gap-2 bg-white text-stone-950 text-[10px] font-extrabold uppercase tracking-[0.2em] px-5 py-3 rounded-full hover:bg-lime-400 transition-colors"
                  >
                    Shop The Look
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="text-sm font-bold text-stone-300">₹{price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </article>
          );
        })}

        {looks.length === 0 && (
          <p className="text-center text-sm text-stone-400 py-20">The new lookbook is being shot. Check back soon.</p>
        )}
      </section>

      {/* Outro */}
      <section className="border-t border-stone-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 sm:py-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <h2 className="font-syne font-extrabold text-3xl sm:text-5xl uppercase tracking-tight leading-none">
            Seen enough?
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 self-start bg-lime-400 text-stone-950 text-[11px] font-extrabold uppercase tracking-[0.2em] px-6 py-3.5 rounded-full hover:bg-lime-300 transition-colors"
          >
            Shop All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
