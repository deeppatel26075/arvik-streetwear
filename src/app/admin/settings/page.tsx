'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Check, RefreshCw, Database, X, Image as ImageIcon } from 'lucide-react';

export default function AdminSettings() {
  const [heroTitle, setHeroTitle] = useState('WEAR YOUR IDENTITY');
  const [heroSlogan, setHeroSlogan] = useState('Heavyweight fabrics. Bold printed oversized silhouettes. Premium local craftsmanship.');
  const [heroImageUrl, setHeroImageUrl] = useState('https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1600');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [brandStoryTitle, setBrandStoryTitle] = useState('Engineered Streetwear');
  const [brandStoryDesc, setBrandStoryDesc] = useState('At ARVIIK, we believe clothing is more than fabric—it is an outward projection of internal identity.');
  const [brandStoryImageUrl, setBrandStoryImageUrl] = useState('https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800');
  
  // Background configuration
  const [bgStyle, setBgStyle] = useState('default'); // 'default' | 'white' | 'charcoal' | 'sepia' | 'custom-color' | 'custom-image'
  const [customBgColor, setCustomBgColor] = useState('#fafaf9');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [nextDropDate, setNextDropDate] = useState('2026-06-25T18:00');

  // Payment configuration
  const [paymentMode, setPaymentMode] = useState('simulation'); // 'simulation' | 'live'
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');

  // Instagram Lookbook Gallery Images
  const [gallery1, setGallery1] = useState('https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600');
  const [gallery2, setGallery2] = useState('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600');
  const [gallery3, setGallery3] = useState('https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600');
  const [gallery4, setGallery4] = useState('https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600');
  const [gallery5, setGallery5] = useState('https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600');
  const [gallery6, setGallery6] = useState('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Seeding states
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Parse local image files to base64 strings
  const handleConfigImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setter(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Parse local video files to base64 strings
  const handleConfigVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('The chosen video is larger than 8MB. For best performance, please use an optimized loop.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setter(base64String);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // 1. Try local storage cache first
        const local = localStorage.getItem('arviik_custom_settings');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.hero_config) {
            setHeroTitle(parsed.hero_config.title || '');
            setHeroSlogan(parsed.hero_config.slogan || '');
            setHeroImageUrl(parsed.hero_config.image_url || '');
            setHeroVideoUrl(parsed.hero_config.video_url || '');
          }
          if (parsed.story_config) {
            setBrandStoryTitle(parsed.story_config.title || '');
            setBrandStoryDesc(parsed.story_config.desc || '');
            setBrandStoryImageUrl(parsed.story_config.image_url || '');
          }
          if (parsed.general_config) {
            setBgStyle(parsed.general_config.bg_style || 'default');
            setCustomBgColor(parsed.general_config.custom_bg_color || '#fafaf9');
            setBgImageUrl(parsed.general_config.bg_image_url || '');
            setNextDropDate(parsed.general_config.next_drop_date || '2026-06-25T18:00');
          }
          if (parsed.payment_config) {
            setPaymentMode(parsed.payment_config.payment_mode || 'simulation');
            setRazorpayKeyId(parsed.payment_config.key_id || '');
            setRazorpayKeySecret(parsed.payment_config.key_secret || '');
          }
          if (parsed.gallery_config) {
            setGallery1(parsed.gallery_config.img1 || '');
            setGallery2(parsed.gallery_config.img2 || '');
            setGallery3(parsed.gallery_config.img3 || '');
            setGallery4(parsed.gallery_config.img4 || '');
            setGallery5(parsed.gallery_config.img5 || '');
            setGallery6(parsed.gallery_config.img6 || '');
          }
        }

        // 2. Fetch from database
        const { data } = await supabase
          .from('site_settings')
          .select('*');

        if (data && data.length > 0) {
          const heroConfig = data.find(item => item.key === 'hero_config')?.value;
          const storyConfig = data.find(item => item.key === 'story_config')?.value;
          const generalConfig = data.find(item => item.key === 'general_config')?.value;
          const paymentConfig = data.find(item => item.key === 'payment_config')?.value;
          const galleryConfig = data.find(item => item.key === 'gallery_config')?.value;

          const merged: any = {};

          if (heroConfig) {
            setHeroTitle(heroConfig.title || '');
            setHeroSlogan(heroConfig.slogan || '');
            setHeroImageUrl(heroConfig.image_url || '');
            setHeroVideoUrl(heroConfig.video_url || '');
            merged.hero_config = heroConfig;
          }
          if (storyConfig) {
            setBrandStoryTitle(storyConfig.title || '');
            setBrandStoryDesc(storyConfig.desc || '');
            setBrandStoryImageUrl(storyConfig.image_url || '');
            merged.story_config = storyConfig;
          }
          if (generalConfig) {
            setBgStyle(generalConfig.bg_style || 'default');
            setCustomBgColor(generalConfig.custom_bg_color || '#fafaf9');
            setBgImageUrl(generalConfig.bg_image_url || '');
            setNextDropDate(generalConfig.next_drop_date || '2026-06-25T18:00');
            merged.general_config = generalConfig;
          }
          if (paymentConfig) {
            setPaymentMode(paymentConfig.payment_mode || 'simulation');
            setRazorpayKeyId(paymentConfig.key_id || '');
            setRazorpayKeySecret(paymentConfig.key_secret || '');
            merged.payment_config = paymentConfig;
          }
          if (galleryConfig) {
            setGallery1(galleryConfig.img1 || '');
            setGallery2(galleryConfig.img2 || '');
            setGallery3(galleryConfig.img3 || '');
            setGallery4(galleryConfig.img4 || '');
            setGallery5(galleryConfig.img5 || '');
            setGallery6(galleryConfig.img6 || '');
            merged.gallery_config = galleryConfig;
          }

          // Merge db settings back into localStorage
          localStorage.setItem('arviik_custom_settings', JSON.stringify({
            ...JSON.parse(local || '{}'),
            ...merged
          }));
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const localSettings = {
      hero_config: {
        title: heroTitle,
        slogan: heroSlogan,
        image_url: heroImageUrl,
        video_url: heroVideoUrl,
      },
      story_config: {
        title: brandStoryTitle,
        desc: brandStoryDesc,
        image_url: brandStoryImageUrl,
      },
      general_config: {
        bg_style: bgStyle,
        custom_bg_color: customBgColor,
        bg_image_url: bgImageUrl,
        next_drop_date: nextDropDate,
      },
      payment_config: {
        payment_mode: paymentMode,
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      },
      gallery_config: {
        img1: gallery1,
        img2: gallery2,
        img3: gallery3,
        img4: gallery4,
        img5: gallery5,
        img6: gallery6,
      }
    };

    try {
      // Upsert to Supabase site_settings table
      await supabase.from('site_settings').upsert({ key: 'hero_config', value: localSettings.hero_config });
      await supabase.from('site_settings').upsert({ key: 'story_config', value: localSettings.story_config });
      await supabase.from('site_settings').upsert({ key: 'general_config', value: localSettings.general_config });
      await supabase.from('site_settings').upsert({ key: 'payment_config', value: localSettings.payment_config });
      await supabase.from('site_settings').upsert({ key: 'gallery_config', value: localSettings.gallery_config });

      // Update localStorage cache
      localStorage.setItem('arviik_custom_settings', JSON.stringify(localSettings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Supabase settings write failed, saving locally:', err);
      localStorage.setItem('arviik_custom_settings', JSON.stringify(localSettings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSeed = async () => {
    if (!confirm('This will seed 45 premium oversized streetwear products into your catalog (both Database and Local Cache). Proceed?')) {
      return;
    }

    setSeeding(true);
    setSeedSuccess(false);

    // Categories lookup
    let categoriesList = [];
    const localCats = localStorage.getItem('arviik_custom_categories');
    if (localCats) {
      categoriesList = JSON.parse(localCats);
    } else {
      categoriesList = [
        { id: 'cat-001', name: 'Graphic Prints', slug: 'graphic-prints' },
        { id: 'cat-002', name: 'Minimalist Typo', slug: 'minimalist-typo' }
      ];
    }

    // Streetwear product generation constants
    const adjectives = ['VINTAGE', 'NEON', 'CYBER', 'CHRONICLE', 'STREET', 'METROPOLIS', 'ARCHIVE', 'SHADOW', 'SACRED', 'OVERDRIVE', 'LIMITLESS', 'DRIFT', 'TOKYO', 'SOUL', 'HARMONY', 'REBEL', 'KINETIC', 'STATIC', 'PHANTOM', 'GHOST'];
    const nouns = ['PULSE', 'SHIELD', 'DISCORD', 'RUSH', 'DIMENSION', 'SYSTEM', 'SYMMETRY', 'GLITCH', 'ECHO', 'MATRIX', 'FORCE', 'SPIRIT', 'COSMOS', 'NEXUS', 'SPECTRUM', 'WARRIOR', 'VORTEX', 'SYNAPSE', 'TURBINE', 'NOMAD'];
    const colors = ['SAND', 'CHARCOAL', 'OLIVE', 'CREAM', 'NAVY', 'MAROON', 'SAGE', 'DUST', 'ONYX', 'COBALT', 'OFF-WHITE', 'STONE', 'RUST', 'CLAY', 'MUSTARD'];
    
    const imageOptions = [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=600',
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=600',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600',
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=600',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600',
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600'
    ];

    const generatedProducts: any[] = [];

    // Build 45 products
    for (let i = 1; i <= 45; i++) {
      const adj = adjectives[i % adjectives.length];
      const noun = nouns[(i * 3) % nouns.length];
      const color = colors[(i * 7) % colors.length];
      
      const name = `${adj} ${noun} ${color} OVERSIZED TEE`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const price = 1000 + (i * 20) % 1000; // Rs 1000 to Rs 1980
      const discount = Math.random() > 0.3 ? Math.round(price * 0.8) : undefined;
      const cat = categoriesList[i % categoriesList.length];

      const img1 = imageOptions[i % imageOptions.length];
      const img2 = imageOptions[(i + 1) % imageOptions.length];

      const newProduct = {
        id: `prod-seeded-${1000 + i}`,
        name,
        slug,
        description: `Premium drop shoulder oversized streetwear tee from the ARVIIK Lab. Custom heavy-ribbed crewneck collar, featuring high-density artistic graphic prints. Structured heavyweight drape.`,
        price,
        discount_price: discount,
        category: { name: cat.name },
        categoryName: cat.name,
        category_id: cat.id,
        fabric: '100% Premium Combed Cotton',
        gsm: i % 2 === 0 ? '240 GSM Heavyweight' : '260 GSM Ultra-Heavyweight',
        fit_type: 'Oversized Boxy Fit',
        wash_instructions: 'Cold machine wash inside out. Do not tumble dry. Do not iron print.',
        images: [img1, img2],
        product_images: [
          { image_url: img1 },
          { image_url: img2 }
        ],
        sizes: [
          { size: 'S', quantity: 10 + (i % 15) },
          { size: 'M', quantity: 12 + (i % 15) },
          { size: 'L', quantity: 15 + (i % 20) },
          { size: 'XL', quantity: 8 + (i % 10) },
          { size: 'XXL', quantity: 5 + (i % 5) }
        ],
        inventory: [
          { size: 'S', quantity: 10 + (i % 15) },
          { size: 'M', quantity: 12 + (i % 15) },
          { size: 'L', quantity: 15 + (i % 20) },
          { size: 'XL', quantity: 8 + (i % 10) },
          { size: 'XXL', quantity: 5 + (i % 5) }
        ],
        is_featured: i % 5 === 0,
        is_hidden: false
      };

      generatedProducts.push(newProduct);
    }

    try {
      await supabase.from('products').delete().like('id', 'prod-seeded-%');

      for (const item of generatedProducts) {
        const { data: dbProd } = await supabase
          .from('products')
          .insert({
            name: item.name,
            slug: item.slug,
            description: item.description,
            price: item.price,
            discount_price: item.discount_price,
            category_id: item.category_id,
            fabric: item.fabric,
            gsm: item.gsm,
            fit_type: item.fit_type,
            wash_instructions: item.wash_instructions,
            is_featured: item.is_featured,
          })
          .select('id')
          .single();

        if (dbProd) {
          const dbId = dbProd.id;
          await supabase.from('product_images').insert([
            { product_id: dbId, image_url: item.images[0], display_order: 0 },
            { product_id: dbId, image_url: item.images[1], display_order: 1 }
          ]);
          await supabase.from('inventory').insert(
            item.inventory.map((inv: any) => ({
              product_id: dbId,
              size: inv.size,
              quantity: inv.quantity
            }))
          );
        }
      }
    } catch (dbErr) {
      console.warn('Database seed insert skipped or failed, seeding locally:', dbErr);
    }

    const storedProds = localStorage.getItem('arviik_custom_products');
    let existingProds = [];
    if (storedProds) {
      existingProds = JSON.parse(storedProds).filter((p: any) => !p.id.startsWith('prod-seeded-'));
    }
    const mergedProds = [...existingProds, ...generatedProducts];
    localStorage.setItem('arviik_custom_products', JSON.stringify(mergedProds));

    setSeedSuccess(true);
    setSeeding(false);
    setTimeout(() => setSeedSuccess(false), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
          Website Configurations
        </h1>
        <p className="text-xs text-stone-500 font-light mt-0.5">Customize homepage headers, banner slides, colors, and marketing copy.</p>
      </div>

      {saveSuccess && (
        <p className="bg-emerald-50 text-emerald-800 text-[11px] font-semibold p-3 border border-emerald-100 rounded-xs flex items-center space-x-1.5 uppercase tracking-wider max-w-2xl">
          <Check className="h-4 w-4" />
          <span>Homepage configurations saved successfully!</span>
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
          <span>Retrieving current settings...</span>
        </div>
      ) : (
        <div className="space-y-8">
          <form onSubmit={handleSaveSettings} className="bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs max-w-2xl space-y-6 text-xs font-semibold text-stone-850">
            
            {/* Section: Hero */}
            <div className="space-y-4">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Hero Slider Settings</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Hero Slogan Bold Title</label>
                <input
                  type="text"
                  required
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Sub-slogan description</label>
                <textarea
                  rows={2}
                  required
                  value={heroSlogan}
                  onChange={(e) => setHeroSlogan(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                />
              </div>

              {/* Hero Video Uploader & Preview */}
              <div className="space-y-2 p-3 bg-stone-50 rounded-sm border border-stone-200/60">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Hero Banner Loop Video</label>
                <div className="flex items-center space-x-4">
                  {heroVideoUrl ? (
                    <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <video src={heroVideoUrl} className="object-cover w-full h-full" muted />
                      <button
                        type="button"
                        onClick={() => setHeroVideoUrl('')}
                        className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-20 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[10px] font-bold">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-grow space-y-1.5">
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => handleConfigVideoUpload(e, setHeroVideoUrl)}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Or paste loop video URL..."
                      value={heroVideoUrl.startsWith('data:') ? '' : heroVideoUrl}
                      onChange={(e) => setHeroVideoUrl(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Image Uploader & Preview */}
              <div className="space-y-2 p-3 bg-stone-50 rounded-sm border border-stone-200/60">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Hero Banner Background Image</label>
                <div className="flex items-center space-x-4">
                  {heroImageUrl ? (
                    <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                      <img src={heroImageUrl} alt="Hero Banner" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setHeroImageUrl('')}
                        className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-20 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[10px] font-bold">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-grow space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleConfigImageUpload(e, setHeroImageUrl)}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Or paste banner image URL..."
                      value={heroImageUrl.startsWith('data:') ? '' : heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Brand Story */}
            <div className="space-y-4 pt-4">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Brand Story Settings</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Story Section Title</label>
                <input
                  type="text"
                  required
                  value={brandStoryTitle}
                  onChange={(e) => setBrandStoryTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Story Description Body</label>
                <textarea
                  rows={3}
                  required
                  value={brandStoryDesc}
                  onChange={(e) => setBrandStoryDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                />
              </div>

              {/* Story Image Uploader & Preview */}
              <div className="space-y-2 p-3 bg-stone-50 rounded-sm border border-stone-200/60">
                <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Brand Story Image</label>
                <div className="flex items-center space-x-4">
                  {brandStoryImageUrl ? (
                    <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                      <img src={brandStoryImageUrl} alt="Story Section" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setBrandStoryImageUrl('')}
                        className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-20 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[10px] font-bold">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-grow space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleConfigImageUpload(e, setBrandStoryImageUrl)}
                      className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Or paste story image URL..."
                      value={brandStoryImageUrl.startsWith('data:') ? '' : brandStoryImageUrl}
                      onChange={(e) => setBrandStoryImageUrl(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Drop Schedule */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Drop Schedule Settings</span>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Next Release Access Date / Time</label>
                <input
                  type="datetime-local"
                  value={nextDropDate}
                  onChange={(e) => setNextDropDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                />
              </div>
            </div>

            {/* Section: Payment Gateway */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Payment Gateway Configurations</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Checkout Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                >
                  <option value="simulation">Demo Simulation Mode (Bypass active keys)</option>
                  <option value="live">Live Gateway Mode (Official Razorpay popup)</option>
                </select>
              </div>

              {paymentMode === 'live' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Razorpay Key ID</label>
                    <input
                      type="text"
                      required
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      placeholder="rzp_test_..."
                      className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Razorpay Key Secret</label>
                    <input
                      type="password"
                      required
                      value={razorpayKeySecret}
                      onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section: Website Styling */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Overall Website Background Styling</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Background Theme Mode</label>
                  <select
                    value={bgStyle}
                    onChange={(e) => setBgStyle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                  >
                    <option value="default">Default Off-White (#fafaf9)</option>
                    <option value="white">Pure White (#ffffff)</option>
                    <option value="charcoal">Dark Street Charcoal (#0f0f0f)</option>
                    <option value="sepia">Vintage Sepia (#f4efe6)</option>
                    <option value="custom-color">Custom Background HEX Color</option>
                    <option value="custom-image">Custom Background Image URL</option>
                  </select>
                </div>

                {bgStyle === 'custom-color' && (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Custom Background Color (HEX)</label>
                    <input
                      type="text"
                      placeholder="#fafaf9"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-mono"
                    />
                  </div>
                )}

                {bgStyle === 'custom-image' && (
                  <div className="space-y-2 col-span-2 p-3 bg-stone-50 rounded-sm border border-stone-200/60">
                    <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Custom Background Image</label>
                    <div className="flex items-center space-x-4">
                      {bgImageUrl ? (
                        <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                          <img src={bgImageUrl} alt="Custom Background" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setBgImageUrl('')}
                            className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-20 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[10px] font-bold">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-grow space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleConfigImageUpload(e, setBgImageUrl)}
                          className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Or paste background image URL..."
                          value={bgImageUrl.startsWith('data:') ? '' : bgImageUrl}
                          onChange={(e) => setBgImageUrl(e.target.value)}
                          className="w-full bg-white border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Instagram Lookbook Gallery */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Instagram Lookbook Gallery (6 Images)</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Gallery Photo 1', val: gallery1, set: setGallery1 },
                  { label: 'Gallery Photo 2', val: gallery2, set: setGallery2 },
                  { label: 'Gallery Photo 3', val: gallery3, set: setGallery3 },
                  { label: 'Gallery Photo 4', val: gallery4, set: setGallery4 },
                  { label: 'Gallery Photo 5', val: gallery5, set: setGallery5 },
                  { label: 'Gallery Photo 6', val: gallery6, set: setGallery6 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2 p-3 bg-stone-50 rounded-sm border border-stone-200/60">
                    <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">{item.label}</label>
                    <div className="flex items-center space-x-3">
                      {item.val ? (
                        <div className="relative w-12 h-12 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                          <img src={item.val} alt={item.label} className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => item.set('')}
                            className="absolute top-0.5 right-0.5 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[9px] font-bold">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-grow space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleConfigImageUpload(e, item.set)}
                          className="w-full text-[10px] text-stone-500 file:mr-2 file:py-0.5 file:px-1.5 file:rounded-sm file:border-0 file:text-[9px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Paste image URL..."
                          value={item.val.startsWith('data:') ? '' : item.val}
                          onChange={(e) => item.set(e.target.value)}
                          className="w-full bg-white border border-stone-200 px-2 py-1 text-[10px] focus:outline-none focus:border-stone-900 rounded-sm font-sans"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2 shadow-sm font-sans"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{saving ? 'Saving changes...' : 'Save Configuration'}</span>
            </button>
          </form>

          {/* Catalog Seeding Tool */}
          <div className="bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs max-w-2xl space-y-4">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">Development & Test Tools</span>
            
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Bulk Seed test products</h4>
              <p className="text-[11px] text-stone-500 font-light leading-relaxed">
                Need to test filter navigation, paginations, and grid response with 40-50 products?
                Click below to instantly create **45 mock streetwear oversized tees** pre-loaded with images, sizes, stock levels, and discount tags.
              </p>
            </div>

            {seedSuccess && (
              <p className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold p-3 border border-emerald-100 rounded-xs flex items-center space-x-1.5 uppercase tracking-wider">
                <Check className="h-4 w-4" />
                <span>45 streetwear products added to Catalog cache! Refresh `/shop` to browse.</span>
              </p>
            )}

            <button
              onClick={handleBulkSeed}
              disabled={seeding}
              className="inline-flex items-center space-x-2 bg-stone-900 hover:bg-stone-850 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-xs shadow-xs transition-colors"
            >
              {seeding ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating Catalog...</span>
                </>
              ) : (
                <>
                  <Database className="h-4.5 w-4.5" />
                  <span>Generate 45 T-Shirts</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
