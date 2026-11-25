'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AREA_LABEL, FONT_LABEL, GRAPHICS, type Area, type Design, type FontKey } from '@/lib/customizer';
import { Download, Palette } from 'lucide-react';

type Row = {
  id: string;
  size: string;
  color_name: string;
  color_hex: string;
  design: Design;
  preview_front: string | null;
  preview_back: string | null;
};

// Shows the Customize designs attached to an order: previews plus every
// print layer (uploaded files to download, text with font and colour).
export default function CustomDesignsPanel({ orderId }: { orderId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('custom_designs')
      .select('id, size, color_name, color_hex, design, preview_front, preview_back')
      .eq('order_id', orderId)
      .then(({ data }: { data: Row[] | null }) => {
        if (!cancelled) setRows(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="space-y-3 text-xs text-stone-600">
      <p className="font-bold text-[10px] text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
        <Palette className="w-3.5 h-3.5" /> Custom designs to print
      </p>
      {rows.map((r) => (
        <div key={r.id} className="border border-stone-200 rounded-sm p-3 space-y-3 bg-stone-50">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-stone-300" style={{ background: r.color_hex }} />
              {r.color_name} · Size {r.size}
            </span>
            <span className="text-[9px] text-stone-400 font-mono">{r.id.slice(0, 8)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[r.preview_front, r.preview_back].map((src, i) =>
              src ? (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={i ? 'Back' : 'Front'} className="w-full rounded-sm border border-stone-200 bg-white" />
                  <span className="block text-center text-[9px] uppercase tracking-widest text-stone-400 mt-1">{i ? 'Back' : 'Front'}</span>
                </a>
              ) : null
            )}
          </div>
          <ul className="space-y-1.5">
            {(Object.keys(AREA_LABEL) as Area[]).flatMap((area) =>
              (r.design?.areas?.[area] || []).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span>
                    <strong className="text-stone-800">{AREA_LABEL[area]}:</strong>{' '}
                    {l.kind === 'text' && (
                      <>
                        “{l.text}” · {FONT_LABEL[(l.font as FontKey) || 'bold']} ·{' '}
                        <span className="inline-block w-2.5 h-2.5 rounded-full align-middle border border-stone-300" style={{ background: l.color }} /> {l.color}
                      </>
                    )}
                    {l.kind === 'graphic' && (
                      <>
                        Graphic “{GRAPHICS.find((g) => g.id === l.graphic)?.label || l.graphic}” · {l.color}
                      </>
                    )}
                    {l.kind === 'image' && 'Uploaded artwork'}
                  </span>
                  {l.kind === 'image' && l.src && !l.src.startsWith('data:') && (
                    <a href={l.src} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 text-stone-900 font-bold uppercase text-[9px] tracking-wider hover:underline">
                      <Download className="w-3 h-3" /> File
                    </a>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
