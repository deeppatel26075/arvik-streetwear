'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { refreshStorefront } from '@/app/actions/refreshStorefront';
import { Plus, Trash2, Save, Check, RefreshCw, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink } from 'lucide-react';

type ColorRow = { id?: number; name: string; hex: string; sort_order: number; is_active: boolean };

const HEX_RE = /^#[0-9a-f]{6}$/i;

// Admin → Customizer: the tee colours customers can pick in Customize.
export default function AdminCustomizer() {
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (data: ColorRow[] | null, failed: boolean) => {
    if (failed) setMessage({ ok: false, text: 'Could not load colours. Has the 0013_customizer.sql script been run in Supabase?' });
    setColors(data || []);
    setRemoved([]);
    setLoading(false);
  };
  const fetchColors = () => supabase.from('customizer_colors').select('*').order('sort_order');
  const load = async () => {
    const { data, error } = await fetchColors();
    apply(data as ColorRow[] | null, !!error);
  };

  useEffect(() => {
    let cancelled = false;
    fetchColors().then(({ data, error }) => {
      if (!cancelled) apply(data as ColorRow[] | null, !!error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (i: number, patch: Partial<ColorRow>) =>
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const move = (i: number, dir: -1 | 1) =>
    setColors((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i: number) =>
    setColors((prev) => {
      const c = prev[i];
      if (c.id) setRemoved((r) => [...r, c.id!]);
      return prev.filter((_, idx) => idx !== i);
    });

  const add = () =>
    setColors((prev) => [...prev, { name: 'New colour', hex: '#888888', sort_order: prev.length + 1, is_active: true }]);

  const save = async () => {
    setMessage(null);
    const bad = colors.find((c) => !c.name.trim() || !HEX_RE.test(c.hex));
    if (bad) {
      setMessage({ ok: false, text: `Check “${bad.name || 'unnamed'}”: it needs a name and a colour like #1a2b3c.` });
      return;
    }
    setSaving(true);
    try {
      if (removed.length) {
        const { error } = await supabase.from('customizer_colors').delete().in('id', removed);
        if (error) throw error;
      }
      const rows = colors.map((c, i) => ({
        ...(c.id ? { id: c.id } : {}),
        name: c.name.trim(),
        hex: c.hex.toLowerCase(),
        sort_order: i + 1,
        is_active: c.is_active,
        updated_at: new Date().toISOString(),
      }));
      const existing = rows.filter((r) => 'id' in r);
      const fresh = rows.filter((r) => !('id' in r));
      if (existing.length) {
        const { error } = await supabase.from('customizer_colors').upsert(existing);
        if (error) throw error;
      }
      if (fresh.length) {
        const { error } = await supabase.from('customizer_colors').insert(fresh);
        if (error) throw error;
      }
      await refreshStorefront().catch(() => null);
      setMessage({ ok: true, text: 'Saved. Customers see the new colours right away.' });
      await load();
    } catch (err) {
      setMessage({ ok: false, text: (err as { message?: string })?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-950">Customizer</h1>
          <p className="text-xs text-stone-500 mt-1">
            Tee colours customers can choose in{' '}
            <Link href="/customize" target="_blank" className="underline inline-flex items-center gap-0.5">
              Customize <ExternalLink className="w-3 h-3" />
            </Link>
            . Hide a colour when that blank is out of stock.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={add} className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white">
            <Plus className="w-3.5 h-3.5" /> Add colour
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-950 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-xs font-semibold flex items-center gap-1.5 ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {message.ok && <Check className="w-3.5 h-3.5" />} {message.text}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest py-10">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading colours…
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-sm divide-y divide-stone-100">
          {colors.length === 0 && <p className="p-6 text-xs text-stone-400">No colours yet. Add one.</p>}
          {colors.map((c, i) => (
            <div key={c.id ?? `new-${i}`} className={`flex items-center gap-3 p-3 ${c.is_active ? '' : 'opacity-50'}`}>
              <label className="relative w-10 h-10 rounded-full border border-stone-300 overflow-hidden flex-shrink-0 cursor-pointer" style={{ background: c.hex }}>
                <input
                  type="color"
                  value={HEX_RE.test(c.hex) ? c.hex : '#888888'}
                  onChange={(e) => update(i, { hex: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label={`Colour for ${c.name}`}
                />
              </label>
              <input
                value={c.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="flex-1 min-w-0 border border-stone-200 rounded-sm px-2.5 py-2 text-xs font-semibold"
                aria-label="Colour name"
              />
              <input
                value={c.hex}
                onChange={(e) => update(i, { hex: e.target.value })}
                className="w-24 border border-stone-200 rounded-sm px-2 py-2 text-xs font-mono hidden sm:block"
                aria-label="Hex code"
              />
              <div className="flex items-center gap-1 text-stone-500">
                <button onClick={() => move(i, -1)} className="p-1.5 hover:text-stone-900" aria-label="Move up"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} className="p-1.5 hover:text-stone-900" aria-label="Move down"><ArrowDown className="w-4 h-4" /></button>
                <button onClick={() => update(i, { is_active: !c.is_active })} className="p-1.5 hover:text-stone-900" aria-label={c.is_active ? 'Hide' : 'Show'} title={c.is_active ? 'Visible to customers' : 'Hidden'}>
                  {c.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(i)} className="p-1.5 hover:text-red-600" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-stone-500 leading-relaxed">
        Prices: a custom tee is sold as <strong>Custom Tee</strong> (front print) and <strong>Custom Tee (Front + Back)</strong>{' '}
        (any back or sleeve print). Change their prices in{' '}
        <Link href="/admin/products" className="underline">Products</Link>.
      </p>
    </div>
  );
}
