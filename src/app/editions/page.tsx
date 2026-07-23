import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EditionsPage() {
  let dbEditions: any[] = [];

  try {
    const { data } = await supabase
      .from('editions')
      .select('*, theme:edition_themes(*)')
      .eq('is_active', true);
    if (data) {
      dbEditions = data;
    }
  } catch (err) {
    console.error('Failed to load editions from database:', err);
  }

  const editions = [
    {
      name: 'CHAOS EDITION',
      slug: 'chaos',
      desc: 'For the rebels. Embrace the chaos.',
      style: 'bg-[#111111] text-white',
      badgeStyle: 'bg-white/10 text-white'
    },
    {
      name: 'SAMURAI EDITION',
      slug: 'samurai',
      desc: 'Discipline. Focus. Inner strength.',
      style: 'bg-[#dc2626] text-white',
      badgeStyle: 'bg-white/10 text-white'
    },
    {
      name: 'MINIMAL EDITION',
      slug: 'minimal',
      desc: 'Less is more. Simplicity is power.',
      style: 'bg-[#faf7f2] text-[#111111] border border-[#ECECEC]',
      badgeStyle: 'bg-[#111111]/5 text-[#111111]'
    },
    {
      name: 'VINTAGE EDITION',
      slug: 'vintage',
      desc: 'Timeless looks. Old soul, new vibe.',
      style: 'bg-[#7c2d12] text-white',
      badgeStyle: 'bg-white/10 text-white'
    },
    {
      name: 'ANIME EDITION',
      slug: 'anime',
      desc: 'For the dreamers. Inspired by anime.',
      style: 'bg-[#a855f7] text-white',
      badgeStyle: 'bg-white/10 text-white'
    }
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="font-bold text-xl uppercase tracking-widest text-[#111111]">
          OUR EDITIONS
        </h1>
        <p className="text-xs text-[#666666] font-medium leading-relaxed">
          Every edition has a different vibe.<br />
          Choose your mood, wear your story.
        </p>
      </div>

      {/* Vertical List of Banners */}
      <div className="space-y-4">
        {editions.map((ed) => (
          <Link
            key={ed.slug}
            href={`/editions/${ed.slug}`}
            className={`block p-6 rounded-[18px] hover:translate-y-[-2px] transition-transform duration-200 shadow-xs ${ed.style}`}
          >
            <div className="space-y-2">
              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ed.badgeStyle}`}>
                Active Drop
              </span>
              <h3 className="font-bold text-sm uppercase tracking-widest pt-1">
                {ed.name}
              </h3>
              <p className="text-xs opacity-90 font-medium">
                {ed.desc}
              </p>
            </div>
            <div className="flex items-center space-x-1.5 pt-4 text-[9px] font-bold uppercase tracking-widest border-t border-current/10 mt-4">
              <span>View Collection</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
