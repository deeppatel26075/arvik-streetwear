'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Check, RefreshCw, Eye, EyeOff, Flame, Shirt, Truck, Wallet, Star, Tag, Percent, Gift } from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Flame', Icon: Flame },
  { name: 'Shirt', Icon: Shirt },
  { name: 'Truck', Icon: Truck },
  { name: 'Wallet', Icon: Wallet },
  { name: 'Star', Icon: Star },
  { name: 'Tag', Icon: Tag },
  { name: 'Percent', Icon: Percent },
  { name: 'Gift', Icon: Gift },
];

// Fixed 4 slots — matches the hero carousel on the homepage, which is
// designed for exactly 4 slides.
const DEFAULT_SLIDES = [
  { id: 1, badge: 'Limited Offer', icon: 'Flame', title_main: 'Buy 2 Get', title_highlight: '10% Off', subtitle: 'Limited Time Offer', image_url: '/products/polarize-navy.jpg', sort_order: 1, is_hidden: false },
  { id: 2, badge: 'Bundle Deal', icon: 'Shirt', title_main: 'Buy 3 Tees At', title_highlight: '₹1199', subtitle: 'Use Code: B31199', image_url: '/products/farebi-olive.jpg', sort_order: 2, is_hidden: false },
  { id: 3, badge: 'Pan-India', icon: 'Truck', title_main: 'Free', title_highlight: 'Shipping', subtitle: 'Across India · Orders Above ₹1499', image_url: '/products/mard-paisa-maroon.jpg', sort_order: 3, is_hidden: false },
  { id: 4, badge: 'Prepaid Perk', icon: 'Wallet', title_main: '10% Off', title_highlight: 'Prepaid', subtitle: 'Pay Online & Save', image_url: '/products/polarize-cream.jpg', sort_order: 4, is_hidden: false },
];

export default function AdminHeroBanner() {
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  const loadSlides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('hero_slides').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) setSlides(data);
    } catch (e) {
      console.error('Failed to load hero slides (migration may not be run yet):', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const updateField = (id: number, field: string, value: any) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `hero/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      updateField(id, 'image_url', data.publicUrl);
    } catch (err) {
      console.error('Failed to upload hero image:', err);
      alert('Failed to upload this photo. Please try again.');
    } finally {
      setUploadingId(null);
      e.target.value = '';
    }
  };

  const handleSaveSlide = async (slide: any) => {
    setSavingId(slide.id);
    try {
      const { error } = await supabase.from('hero_slides').upsert({
        id: slide.id,
        badge: slide.badge,
        icon: slide.icon,
        title_main: slide.title_main,
        title_highlight: slide.title_highlight,
        subtitle: slide.subtitle,
        image_url: slide.image_url,
        sort_order: slide.sort_order,
        is_hidden: slide.is_hidden,
      });
      if (error) throw error;
      setSavedId(slide.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      console.error('Failed to save hero slide:', err);
      alert('Failed to save this slide — the hero_slides migration may not be run yet.');
    } finally {
      setSavingId(null);
    }
  };

  const toggleHidden = async (slide: any) => {
    const nextHidden = !slide.is_hidden;
    updateField(slide.id, 'is_hidden', nextHidden);
    const { error } = await supabase.from('hero_slides').upsert({ ...slide, is_hidden: nextHidden });
    if (error) {
      console.error('Failed to update slide visibility:', error);
      alert('Failed to update visibility in the database.');
      updateField(slide.id, 'is_hidden', slide.is_hidden);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">Hero Banner</h1>
        <p className="text-xs text-stone-500 font-light mt-0.5">
          Manage the 4 slides in the homepage promo carousel — swap photos, edit copy, or hide a slide without deleting it.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
          <span>Loading slides...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {slides.map((slide, idx) => (
            <div key={slide.id} className={`bg-white border rounded-xs p-5 shadow-xs space-y-4 text-xs font-semibold text-stone-850 ${slide.is_hidden ? 'border-amber-300 opacity-70' : 'border-stone-200/60'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Slide {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => toggleHidden(slide)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                    slide.is_hidden ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {slide.is_hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{slide.is_hidden ? 'Hidden' : 'Visible'}</span>
                </button>
              </div>

              <div className="flex items-start space-x-4">
                <div className="relative w-24 h-24 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                  {slide.image_url && <img src={slide.image_url} alt={slide.badge || 'Slide'} className="object-cover w-full h-full" />}
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingId === slide.id}
                    onChange={(e) => handleImageUpload(slide.id, e)}
                    className="text-[10px] text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xs file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-900 file:text-white"
                  />
                  {uploadingId === slide.id && <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">Uploading…</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Badge</label>
                  <input
                    type="text"
                    value={slide.badge}
                    onChange={(e) => updateField(slide.id, 'badge', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Icon</label>
                  <select
                    value={slide.icon}
                    onChange={(e) => updateField(slide.id, 'icon', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Title (main)</label>
                  <input
                    type="text"
                    value={slide.title_main}
                    onChange={(e) => updateField(slide.id, 'title_main', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Title (highlight)</label>
                  <input
                    type="text"
                    value={slide.title_highlight}
                    onChange={(e) => updateField(slide.id, 'title_highlight', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Subtitle</label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => updateField(slide.id, 'subtitle', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSlide(slide)}
                disabled={savingId === slide.id}
                className="w-full bg-stone-950 text-white text-[10px] font-bold uppercase tracking-widest py-2.5 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2"
              >
                {savedId === slide.id ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                <span>{savingId === slide.id ? 'Saving...' : savedId === slide.id ? 'Saved' : 'Save Slide'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
