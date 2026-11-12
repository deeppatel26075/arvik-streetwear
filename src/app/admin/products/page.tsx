'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, categoryDisplayName } from '@/lib/utils';
import { Plus, Edit2, Trash2, Check, Eye, EyeOff, Star, X, RefreshCw } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fabric, setFabric] = useState('100% Premium Cotton');
  const [gsm, setGsm] = useState('240 GSM');
  const [fitType, setFitType] = useState('Oversized Fit');
  const [washInstructions, setWashInstructions] = useState('Cold wash inside out');
  const [productImages, setProductImages] = useState<string[]>(['', '', '', '', '']);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Product Story panels — the curated photo + caption strip shown on the
  // product detail page. Falls back to the gallery photos above (with
  // generic captions) on the frontend until these are set.
  const [storyImages, setStoryImages] = useState<string[]>(['', '', '', '', '']);
  const [storyCaptions, setStoryCaptions] = useState<string[]>(['', '', '', '', '']);
  const [uploadingStoryIdx, setUploadingStoryIdx] = useState<number | null>(null);

  // Stock sizes
  const [stockS, setStockS] = useState('10');
  const [stockM, setStockM] = useState('15');
  const [stockL, setStockL] = useState('20');
  const [stockXL, setStockXL] = useState('10');
  const [stockXXL, setStockXXL] = useState('5');

  const uploadToStorage = async (file: File) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSingleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(index);
    try {
      const publicUrl = await uploadToStorage(file);
      const next = [...productImages];
      next[index] = publicUrl;
      setProductImages(next);
    } catch (err) {
      console.error('Failed to upload image to Supabase Storage:', err);
      alert('Failed to upload this photo. Please try again.');
    } finally {
      setUploadingIdx(null);
      e.target.value = '';
    }
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const next = [...productImages];
    next[index] = value;
    setProductImages(next);
  };

  const handleRemoveImage = (index: number) => {
    const next = [...productImages];
    next[index] = '';
    setProductImages(next);
  };

  const handleStoryImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStoryIdx(index);
    try {
      const publicUrl = await uploadToStorage(file);
      const next = [...storyImages];
      next[index] = publicUrl;
      setStoryImages(next);
    } catch (err) {
      console.error('Failed to upload story photo to Supabase Storage:', err);
      alert('Failed to upload this photo. Please try again.');
    } finally {
      setUploadingStoryIdx(null);
      e.target.value = '';
    }
  };

  const handleStoryCaptionChange = (index: number, value: string) => {
    const next = [...storyCaptions];
    next[index] = value;
    setStoryCaptions(next);
  };

  const handleRemoveStoryImage = (index: number) => {
    const nextImages = [...storyImages];
    nextImages[index] = '';
    setStoryImages(nextImages);
    const nextCaptions = [...storyCaptions];
    nextCaptions[index] = '';
    setStoryCaptions(nextCaptions);
  };

  // Load products & categories — always straight from Supabase, never from a local cache
  const loadData = async () => {
    try {
      setLoading(true);

      // Only real DB rows are offered here — the shop page's filter chips
      // separately inject a few always-shown placeholder categories
      // (Limited Edition, On Fire, Psychology Edition) for display, but
      // those aren't valid category_id values unless they also exist as
      // real rows here. Offering a fake id in this dropdown let a product
      // get assigned a category_id that fails to save (invalid UUID).
      const { data: cats, error: catError } = await supabase.from('categories').select('*');
      if (catError) throw catError;

      // Same categories the shop page's filter chips hide from shoppers —
      // keep the admin picker from offering ones nothing on the live site
      // actually surfaces.
      const HIDDEN_CATEGORY_NAMES = ['anime', 'graphic prints'];
      setCategories((cats || []).filter((c) => !HIDDEN_CATEGORY_NAMES.includes(c.name.toLowerCase())));

      const { data: prods, error: prodError } = await supabase
        .from('products')
        .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)')
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;

      // Fetched separately (not embedded above) so a missing/pending
      // product_story_panels migration doesn't take down the whole catalog
      // list — it just leaves story panels empty until the table exists.
      let storyPanelsByProduct: Record<string, any[]> = {};
      try {
        const { data: storyRows, error: storyError } = await supabase
          .from('product_story_panels')
          .select('product_id, image_url, caption, display_order')
          .order('display_order');
        if (storyError) throw storyError;
        storyPanelsByProduct = (storyRows || []).reduce((acc: Record<string, any[]>, row: any) => {
          (acc[row.product_id] = acc[row.product_id] || []).push(row);
          return acc;
        }, {});
      } catch (storyErr) {
        console.error('Error loading product story panels:', storyErr);
      }

      const loadedProds = (prods || []).map((p) => ({
        ...p,
        categoryName: p.category?.name || 'Streetwear',
        images: p.product_images?.map((img: any) => img.image_url) || [],
        sizes: p.inventory || [],
        storyPanels: storyPanelsByProduct[p.id] || [],
      }));
      setProducts(loadedProds);
    } catch (e) {
      console.error('Error loading data from Supabase:', e);
      alert('Could not load catalog data from the database. Check your connection and try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategoryId(categories[0]?.id || '');
    setFabric('100% Premium Cotton');
    setGsm('240 GSM');
    setFitType('Oversized Fit');
    setWashInstructions('Cold machine wash inside out. Do not iron print.');
    setProductImages(['', '', '', '', '']);
    setStoryImages(['', '', '', '', '']);
    setStoryCaptions(['', '', '', '', '']);
    setStockS('10');
    setStockM('15');
    setStockL('20');
    setStockXL('10');
    setStockXXL('5');
    setFormOpen(true);
  };

  const openEditForm = (prod: any) => {
    setEditingId(prod.id);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price.toString());
    setDiscountPrice(prod.discount_price ? prod.discount_price.toString() : '');
    setCategoryId(prod.category_id || categories[0]?.id || '');
    setFabric(prod.fabric || '100% Premium Cotton');
    setGsm(prod.gsm || '240 GSM');
    setFitType(prod.fit_type || 'Oversized Fit');
    setWashInstructions(prod.wash_instructions || 'Cold wash inside out');
    
    const existingImgs = prod.images || prod.product_images?.map((i: any) => i.image_url) || [];
    setProductImages([
      existingImgs[0] || '',
      existingImgs[1] || '',
      existingImgs[2] || '',
      existingImgs[3] || '',
      existingImgs[4] || '',
    ]);

    const existingStoryPanels = prod.storyPanels || prod.product_story_panels || [];
    setStoryImages([
      existingStoryPanels[0]?.image_url || '',
      existingStoryPanels[1]?.image_url || '',
      existingStoryPanels[2]?.image_url || '',
      existingStoryPanels[3]?.image_url || '',
      existingStoryPanels[4]?.image_url || '',
    ]);
    setStoryCaptions([
      existingStoryPanels[0]?.caption || '',
      existingStoryPanels[1]?.caption || '',
      existingStoryPanels[2]?.caption || '',
      existingStoryPanels[3]?.caption || '',
      existingStoryPanels[4]?.caption || '',
    ]);

    // Set stock values from sizes array
    const getQty = (sz: string) => {
      const item = prod.sizes?.find((s: any) => s.size === sz);
      return item ? item.quantity.toString() : '0';
    };
    setStockS(getQty('S'));
    setStockM(getQty('M'));
    setStockL(getQty('L'));
    setStockXL(getQty('XL'));
    setStockXXL(getQty('XXL'));

    setFormOpen(true);
  };

  // Isolated from the main product save so that a missing/pending
  // product_story_panels migration only fails the story-panel step (with
  // a warning) instead of blocking the entire product save.
  const saveStoryPanels = async (productId: string, panels: { image_url: string; caption?: string }[]) => {
    try {
      const { error: delStoryError } = await supabase.from('product_story_panels').delete().eq('product_id', productId);
      if (delStoryError) throw delStoryError;
      for (let i = 0; i < panels.length; i++) {
        const { error: storyError } = await supabase
          .from('product_story_panels')
          .insert({ product_id: productId, image_url: panels[i].image_url, caption: panels[i].caption || null, display_order: i });
        if (storyError) throw storyError;
      }
      return true;
    } catch (err) {
      console.error('Failed to save product story panels:', err);
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const productPayload = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      price: parseFloat(price),
      discount_price: discountPrice ? parseFloat(discountPrice) : null,
      category_id: categoryId || null,
      fabric,
      gsm,
      fit_type: fitType,
      wash_instructions: washInstructions,
    };

    const validImages = productImages.filter((img) => img && img.trim() !== '');
    const validStoryPanels = storyImages
      .map((img, i) => ({ image_url: img, caption: storyCaptions[i] }))
      .filter((panel) => panel.image_url && panel.image_url.trim() !== '');
    let storyPanelsSaved = true;

    try {
      if (editingId) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
        if (error) throw error;

        const { error: delImgError } = await supabase.from('product_images').delete().eq('product_id', editingId);
        if (delImgError) throw delImgError;
        for (let i = 0; i < validImages.length; i++) {
          const { error: imgError } = await supabase.from('product_images').insert({ product_id: editingId, image_url: validImages[i], display_order: i });
          if (imgError) throw imgError;
        }

        storyPanelsSaved = await saveStoryPanels(editingId, validStoryPanels);

        const sizesToUpdate = [
          { size: 'S', qty: parseInt(stockS) },
          { size: 'M', qty: parseInt(stockM) },
          { size: 'L', qty: parseInt(stockL) },
          { size: 'XL', qty: parseInt(stockXL) },
          { size: 'XXL', qty: parseInt(stockXXL) },
        ];
        for (const item of sizesToUpdate) {
          const { error: invError } = await supabase
            .from('inventory')
            .upsert({ product_id: editingId, size: item.size, quantity: item.qty }, { onConflict: 'product_id,size' });
          if (invError) throw invError;
        }
      } else {
        const { data: newProd, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single();

        if (insertError) throw insertError;

        const newId = newProd.id;

        for (let i = 0; i < validImages.length; i++) {
          const { error: imgError } = await supabase.from('product_images').insert({ product_id: newId, image_url: validImages[i], display_order: i });
          if (imgError) throw imgError;
        }

        storyPanelsSaved = await saveStoryPanels(newId, validStoryPanels);

        const inventoryPayload = [
          { product_id: newId, size: 'S', quantity: parseInt(stockS) },
          { product_id: newId, size: 'M', quantity: parseInt(stockM) },
          { product_id: newId, size: 'L', quantity: parseInt(stockL) },
          { product_id: newId, size: 'XL', quantity: parseInt(stockXL) },
          { product_id: newId, size: 'XXL', quantity: parseInt(stockXXL) },
        ];
        const { error: invInsertError } = await supabase.from('inventory').insert(inventoryPayload);
        if (invInsertError) throw invInsertError;
      }

      setFormOpen(false);
      await loadData();
      if (!storyPanelsSaved && validStoryPanels.length > 0) {
        alert('Product saved, but the Product Story photos/captions could not be saved — the product_story_panels migration may not be run yet.');
      }
    } catch (err) {
      console.error('Failed to save product to Supabase:', err);
      alert('Failed to save this product to the database. Nothing was changed — please try again.');
    }
  };

  const toggleHide = async (id: string, currentHidden: boolean) => {
    const { error } = await supabase.from('products').update({ is_hidden: !currentHidden }).eq('id', id);
    if (error) {
      console.error('Failed to update visibility in Supabase:', error);
      alert('Failed to update visibility in the database.');
      return;
    }
    await loadData();
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const { error } = await supabase.from('products').update({ is_featured: !currentFeatured }).eq('id', id);
    if (error) {
      console.error('Failed to update featured flag in Supabase:', error);
      alert('Failed to update the featured flag in the database.');
      return;
    }
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete product in Supabase:', error);
      alert('Failed to delete this product from the database.');
      return;
    }
    await loadData();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-200 pb-5 gap-3">
        <div>
          <h1 className="font-syne font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-stone-900">
            Catalog Manager
          </h1>
          <p className="text-xs text-stone-500 font-light mt-0.5">Add, edit, toggle visibility and manage stocks.</p>
        </div>

        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center space-x-1.5 bg-stone-950 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 rounded-sm shadow-md w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add T-Shirt</span>
        </button>
      </div>

      {/* Products list — table on desktop, cards on mobile */}
      <div className="bg-white border border-stone-200/60 rounded-xs shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
            <span>Loading database products...</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto p-6">
              <table className="w-full text-left text-xs text-stone-600">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Stock S/M/L/XL/2XL</th>
                    <th className="pb-3">Featured</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {products.map((prod) => {
                    const getSzStock = (sz: string) => {
                      const item = prod.sizes?.find((s: any) => s.size === sz);
                      return item ? item.quantity : 0;
                    };
                    return (
                      <tr key={prod.id} className="hover:bg-stone-50/50">
                        <td className="py-4 font-semibold text-stone-900 uppercase tracking-wide pr-4">
                          {prod.name}
                        </td>
                        <td className="py-4 uppercase tracking-wider text-[10px] font-semibold text-stone-500 pr-4">
                          {categoryDisplayName(prod.categoryName)}
                        </td>
                        <td className="py-4 font-mono font-semibold text-stone-900 pr-4">
                          {formatPrice(prod.discount_price || prod.price)}
                        </td>
                        <td className="py-4 font-semibold text-stone-700 pr-4">
                          {getSzStock('S')}/{getSzStock('M')}/{getSzStock('L')}/{getSzStock('XL')}/{getSzStock('XXL')}
                        </td>
                        <td className="py-4 pr-4">
                          <button
                            onClick={() => toggleFeatured(prod.id, prod.is_featured)}
                            className={`p-1 rounded-sm border ${
                              prod.is_featured ? 'bg-amber-50 border-amber-100 text-amber-800' : 'text-stone-300'
                            }`}
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        </td>
                        <td className="py-4 flex items-center space-x-2.5">
                          <button
                            onClick={() => toggleHide(prod.id, prod.is_hidden)}
                            className={`p-1 hover:opacity-80 ${prod.is_hidden ? 'text-amber-800' : 'text-stone-500'}`}
                          >
                            {prod.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openEditForm(prod)}
                            className="p-1 text-stone-500 hover:text-stone-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1 text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-stone-100">
              {products.map((prod) => {
                const getSzStock = (sz: string) => {
                  const item = prod.sizes?.find((s: any) => s.size === sz);
                  return item ? item.quantity : 0;
                };
                return (
                  <div key={prod.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-syne font-bold text-sm text-stone-900 uppercase tracking-wide leading-tight">
                          {prod.name}
                        </p>
                        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mt-0.5">
                          {categoryDisplayName(prod.categoryName)}
                        </p>
                      </div>
                      <p className="font-mono font-bold text-stone-900 text-sm flex-shrink-0">
                        {formatPrice(prod.discount_price || prod.price)}
                      </p>
                    </div>
                    <p className="text-[11px] text-stone-500 font-semibold">
                      Stock — S:{getSzStock('S')} M:{getSzStock('M')} L:{getSzStock('L')} XL:{getSzStock('XL')} XXL:{getSzStock('XXL')}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => toggleFeatured(prod.id, prod.is_featured)}
                        className={`p-2 rounded-sm border ${
                          prod.is_featured ? 'bg-amber-50 border-amber-100 text-amber-800' : 'text-stone-300 border-stone-200'
                        }`}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                      <button
                        onClick={() => toggleHide(prod.id, prod.is_hidden)}
                        className={`p-2 rounded-sm border border-stone-200 ${prod.is_hidden ? 'text-amber-800' : 'text-stone-500'}`}
                      >
                        {prod.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEditForm(prod)}
                        className="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest border border-stone-200 text-stone-700 rounded-sm flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-2 rounded-sm border border-red-100 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Drawer Modal overlay */}
      {formOpen && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs z-50 flex items-end sm:items-stretch sm:justify-end">
          {/* On mobile: bottom sheet. On desktop: right-side panel */}
          <div className="bg-white w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-full sm:h-full overflow-y-auto rounded-t-2xl sm:rounded-none">
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            <div className="flex justify-between items-center border-b border-stone-200 px-5 py-4 sticky top-0 bg-white z-10">
              <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider">
                {editingId ? 'Edit product' : 'Add new product'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-stone-500 hover:text-stone-900 p-2 -mr-2 touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-stone-850 p-5 pb-8">
              
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="ARCHIVE-01 GRAPHIC TEE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed description of fit and design..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Price (INR)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="1499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Discount Price</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="1299"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryDisplayName(c.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fit Type</label>
                  <input
                    type="text"
                    value={fitType}
                    onChange={(e) => setFitType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fabric Specs</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">GSM weight</label>
                  <input
                    type="text"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Wash Care Instructions</label>
                <input
                  type="text"
                  value={washInstructions}
                  onChange={(e) => setWashInstructions(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              {/* Image Upload / Links (Up to 5 Photos) */}
              <div className="space-y-3 p-3.5 bg-stone-50 rounded-sm border border-stone-200/60">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="text-[10px] text-stone-600 font-extrabold uppercase tracking-wider">Gallery Photos (up to 5)</span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{productImages.filter(Boolean).length} / 5</span>
                </div>
                
                {[
                  'Main / Front View',
                  'Back View',
                  'Detail / Fabric Close-up',
                  'Fit / Side View',
                  'Studio / On-Model'
                ].map((label, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-stone-200 rounded-sm">
                    <label className="text-[9px] text-stone-700 font-bold uppercase tracking-wider block mb-2">
                      Photo {idx + 1}: {label}
                    </label>
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {productImages[idx] ? (
                        <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                          <img src={productImages[idx]} alt={`Photo ${idx + 1}`} className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-20 border-2 border-dashed border-stone-300 rounded-sm flex flex-col items-center justify-center text-stone-400 flex-shrink-0 text-[9px] font-bold">
                          <span>Slot {idx + 1}</span>
                        </div>
                      )}
                      {/* Upload + URL inputs stacked */}
                      <div className="flex-1 flex flex-col gap-2 justify-center min-w-0">
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300 rounded-sm py-2 text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-white active:bg-stone-50 ${uploadingIdx === idx ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadingIdx === idx ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Uploading…
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Upload Photo
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingIdx === idx}
                            onChange={(e) => handleSingleImageUpload(idx, e)}
                            className="sr-only"
                          />
                        </label>
                        <input
                          type="url"
                          inputMode="url"
                          placeholder="Or paste URL…"
                          value={productImages[idx]?.startsWith('data:') ? '' : productImages[idx] || ''}
                          onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 px-2.5 py-2 text-[11px] focus:outline-none focus:border-stone-900 rounded-sm min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Story Photos & Captions (Up to 5) */}
              <div className="space-y-3 p-3.5 bg-stone-50 rounded-sm border border-stone-200/60">
                <div className="border-b pb-1.5">
                  <span className="text-[10px] text-stone-600 font-extrabold uppercase tracking-wider block">Story Photos &amp; Captions (Optional)</span>
                  <span className="text-[9px] text-stone-400 font-medium block mt-0.5">
                    Shown in the &quot;Product Story&quot; strip. Leave blank to use gallery photos.
                  </span>
                </div>

                {[0, 1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-stone-200 rounded-sm">
                    <label className="text-[9px] text-stone-700 font-bold uppercase tracking-wider block mb-2">
                      Story Photo {idx + 1}
                    </label>
                    <div className="flex gap-3">
                      {storyImages[idx] ? (
                        <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                          <img src={storyImages[idx]} alt={`Story photo ${idx + 1}`} className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => handleRemoveStoryImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-20 border-2 border-dashed border-stone-300 rounded-sm flex flex-col items-center justify-center text-stone-400 flex-shrink-0 text-[9px] font-bold">
                          <span>Slot {idx + 1}</span>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2 justify-center min-w-0">
                        <label className={`flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300 rounded-sm py-2 text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-white active:bg-stone-50 ${uploadingStoryIdx === idx ? 'opacity-50 pointer-events-none' : ''}`}>
                          {uploadingStoryIdx === idx ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Uploading…
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Upload Photo
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingStoryIdx === idx}
                            onChange={(e) => handleStoryImageUpload(idx, e)}
                            className="sr-only"
                          />
                        </label>
                        <input
                          type="text"
                          placeholder={`Caption…`}
                          value={storyCaptions[idx] || ''}
                          onChange={(e) => handleStoryCaptionChange(idx, e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 px-2.5 py-2 text-[11px] focus:outline-none focus:border-stone-900 rounded-sm min-w-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inventory Sizes — 3+2 on mobile, 5 on bigger screens */}
              <div className="bg-stone-50 p-3.5 rounded-sm border border-stone-200/60">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block border-b pb-1 mb-3">Inventory Stock Levels</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {[
                    { label: 'S', val: stockS, set: setStockS },
                    { label: 'M', val: stockM, set: setStockM },
                    { label: 'L', val: stockL, set: setStockL },
                    { label: 'XL', val: stockXL, set: setStockXL },
                    { label: 'XXL', val: stockXXL, set: setStockXXL },
                  ].map(({ label, val, set }) => (
                    <div key={label} className="space-y-1">
                      <label className="text-[9px] font-bold text-center block text-stone-600">{label}</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="w-full bg-white border border-stone-200 px-1 py-2 text-center text-xs focus:outline-none focus:border-stone-950 rounded-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit CTA — sticky on mobile */}
              <div className="sticky bottom-0 pt-2 bg-white -mx-5 px-5 pb-2 border-t border-stone-100 sm:static sm:border-0 sm:p-0 sm:bg-transparent">
                <button
                  type="submit"
                  className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-4 hover:opacity-90 transition-opacity rounded-sm shadow-sm"
                >
                  {editingId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
