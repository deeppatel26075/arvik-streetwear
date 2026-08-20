'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, X, RefreshCw, Upload, Loader2, AlertCircle } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const [washInstructions, setWashInstructions] = useState('Cold machine wash inside out. Do not iron directly on print.');
  const [productImages, setProductImages] = useState<string[]>(['', '', '', '', '']);
  const [uploadingSlots, setUploadingSlots] = useState<boolean[]>([false, false, false, false, false]);

  // Stock sizes
  const [stockS, setStockS] = useState('10');
  const [stockM, setStockM] = useState('15');
  const [stockL, setStockL] = useState('20');
  const [stockXL, setStockXL] = useState('10');
  const [stockXXL, setStockXXL] = useState('5');

  const handleSingleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlots((prev) => { const s = [...prev]; s[index] = true; return s; });

    try {
      const ext = file.name.split('.').pop();
      const filePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      const next = [...productImages];
      next[index] = urlData.publicUrl;
      setProductImages(next);
    } catch (err) {
      console.error('Image upload failed:', err);
      setSaveError('Image upload failed. Please try again.');
    } finally {
      setUploadingSlots((prev) => { const s = [...prev]; s[index] = false; return s; });
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

  // Always load fresh from Supabase — no localStorage
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('products')
          .select('*, category:categories(name), product_images(image_url, display_order), inventory(size, quantity)')
          .order('created_at', { ascending: false }),
      ]);

      setCategories(cats || []);
      setProducts(
        (prods || []).map((p) => ({
          ...p,
          categoryName: (p.category as any)?.name || 'Uncategorised',
          images: (p.product_images || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((img: any) => img.image_url),
          sizes: p.inventory || [],
        }))
      );
    } catch (e) {
      console.error('Error loading products:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategoryId(categories[0]?.id || '');
    setFabric('100% Premium Cotton');
    setGsm('240 GSM');
    setFitType('Oversized Fit');
    setWashInstructions('Cold machine wash inside out. Do not iron directly on print.');
    setProductImages(['', '', '', '', '']);
    setUploadingSlots([false, false, false, false, false]);
    setStockS('10');
    setStockM('15');
    setStockL('20');
    setStockXL('10');
    setStockXXL('5');
    setSaveError(null);
  };

  const openAddForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (prod: any) => {
    resetForm();
    setEditingId(prod.id);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price?.toString() || '');
    setDiscountPrice(prod.discount_price ? prod.discount_price.toString() : '');
    setCategoryId(prod.category_id || categories[0]?.id || '');
    setFabric(prod.fabric || '100% Premium Cotton');
    setGsm(prod.gsm || '240 GSM');
    setFitType(prod.fit_type || 'Oversized Fit');
    setWashInstructions(prod.wash_instructions || 'Cold machine wash inside out.');

    const existingImgs = prod.images || [];
    setProductImages([
      existingImgs[0] || '',
      existingImgs[1] || '',
      existingImgs[2] || '',
      existingImgs[3] || '',
      existingImgs[4] || '',
    ]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveLoading(true);

    // Validate
    const priceNum = parseFloat(price);
    const discountPriceNum = discountPrice ? parseFloat(discountPrice) : null;

    if (isNaN(priceNum) || priceNum <= 0) {
      setSaveError('Please enter a valid price.');
      setSaveLoading(false);
      return;
    }
    if (discountPriceNum !== null && discountPriceNum >= priceNum) {
      setSaveError('Discount price must be less than the original price.');
      setSaveLoading(false);
      return;
    }

    const productPayload = {
      name: name.trim(),
      slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description.trim(),
      price: priceNum,
      discount_price: discountPriceNum,
      category_id: categoryId || null,
      fabric,
      gsm,
      fit_type: fitType,
      wash_instructions: washInstructions,
    };

    const validImages = productImages.filter((img) => img && img.trim() !== '');

    try {
      if (editingId) {
        // UPDATE existing product
        const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
        if (error) throw new Error(error.message);

        // Replace images
        await supabase.from('product_images').delete().eq('product_id', editingId);
        for (let i = 0; i < validImages.length; i++) {
          await supabase.from('product_images').insert({ product_id: editingId, image_url: validImages[i], display_order: i });
        }

        // Upsert inventory
        const sizes = [
          { size: 'S', qty: parseInt(stockS) || 0 },
          { size: 'M', qty: parseInt(stockM) || 0 },
          { size: 'L', qty: parseInt(stockL) || 0 },
          { size: 'XL', qty: parseInt(stockXL) || 0 },
          { size: 'XXL', qty: parseInt(stockXXL) || 0 },
        ];
        for (const item of sizes) {
          await supabase.from('inventory').upsert(
            { product_id: editingId, size: item.size, quantity: item.qty },
            { onConflict: 'product_id,size' }
          );
        }
      } else {
        // INSERT new product
        const { data: newProd, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single();

        if (insertError) throw new Error(insertError.message);

        const newId = newProd.id;

        for (let i = 0; i < validImages.length; i++) {
          await supabase.from('product_images').insert({ product_id: newId, image_url: validImages[i], display_order: i });
        }

        await supabase.from('inventory').insert([
          { product_id: newId, size: 'S', quantity: parseInt(stockS) || 0 },
          { product_id: newId, size: 'M', quantity: parseInt(stockM) || 0 },
          { product_id: newId, size: 'L', quantity: parseInt(stockL) || 0 },
          { product_id: newId, size: 'XL', quantity: parseInt(stockXL) || 0 },
          { product_id: newId, size: 'XXL', quantity: parseInt(stockXXL) || 0 },
        ]);
      }

      setFormOpen(false);
      await loadData(); // Reload fresh from DB
    } catch (err: any) {
      console.error('Save product error:', err);
      setSaveError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const toggleHide = async (id: string, currentHidden: boolean) => {
    const { error } = await supabase.from('products').update({ is_hidden: !currentHidden }).eq('id', id);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_hidden: !currentHidden } : p)));
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const { error } = await supabase.from('products').update({ is_featured: !currentFeatured }).eq('id', id);
    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_featured: !currentFeatured } : p)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Failed to delete product: ' + error.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-200 pb-5 gap-4">
        <div>
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
            Catalog Manager
          </h1>
          <p className="text-xs text-stone-500 font-light mt-0.5">Add, edit, toggle visibility and manage stocks.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center space-x-1.5 bg-stone-100 border border-stone-200 text-stone-700 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-200 rounded-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={openAddForm}
            className="inline-flex items-center space-x-1.5 bg-stone-950 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 rounded-sm shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add T-Shirt</span>
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
            <span>Loading database products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs font-semibold uppercase tracking-wider">
            No products yet. Click "Add T-Shirt" to create your first product.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <td className="py-4 font-semibold text-stone-900 uppercase tracking-wide">
                        {prod.name}
                        {prod.is_hidden && (
                          <span className="ml-2 text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-sm font-bold uppercase">Hidden</span>
                        )}
                      </td>
                      <td className="py-4 uppercase tracking-wider text-[10px] font-semibold text-stone-500">
                        {prod.categoryName}
                      </td>
                      <td className="py-4 font-mono font-semibold text-stone-900">
                        {formatPrice(prod.discount_price || prod.price)}
                        {prod.discount_price && (
                          <span className="ml-1 text-stone-400 line-through text-[10px]">{formatPrice(prod.price)}</span>
                        )}
                      </td>
                      <td className="py-4 font-semibold text-stone-700">
                        {getSzStock('S')}/{getSzStock('M')}/{getSzStock('L')}/{getSzStock('XL')}/{getSzStock('XXL')}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => toggleFeatured(prod.id, prod.is_featured)}
                          className={`p-1 rounded-sm border ${prod.is_featured ? 'bg-amber-50 border-amber-100 text-amber-800' : 'text-stone-300 border-transparent'}`}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      </td>
                      <td className="py-4 flex items-center space-x-2.5">
                        <button
                          onClick={() => toggleHide(prod.id, prod.is_hidden)}
                          title={prod.is_hidden ? 'Show product' : 'Hide product'}
                          className={`p-1 hover:opacity-80 ${prod.is_hidden ? 'text-amber-800' : 'text-stone-500'}`}
                        >
                          {prod.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => openEditForm(prod)} className="p-1 text-stone-500 hover:text-stone-900">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(prod.id)} className="p-1 text-stone-400 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Drawer */}
      {formOpen && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl p-6 shadow-2xl flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5 mb-5">
              <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-stone-500 hover:text-stone-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            {saveError && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-[11px] text-red-800 font-bold">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-stone-850">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="ARCHIVE-01 GRAPHIC TEE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed description of fit and design..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1499"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Discount Price (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1299"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fit Type</label>
                  <input
                    type="text"
                    value={fitType}
                    onChange={(e) => setFitType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fabric</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">GSM Weight</label>
                  <input
                    type="text"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Wash Instructions</label>
                <input
                  type="text"
                  value={washInstructions}
                  onChange={(e) => setWashInstructions(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-4 p-4 bg-stone-50 rounded-sm border border-stone-200/60">
                <div className="flex justify-between items-center border-b pb-1.5 mb-2">
                  <span className="text-[10px] text-stone-600 font-extrabold uppercase tracking-wider">
                    Product Gallery (Up to 5 Photos)
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                    {productImages.filter(Boolean).length} / 5 Uploaded
                  </span>
                </div>

                {['Photo 1: Main / Front View', 'Photo 2: Back View', 'Photo 3: Detail / Close-up', 'Photo 4: Fit / Side View', 'Photo 5: Studio / On-Model'].map((label, idx) => (
                  <div key={idx} className="space-y-1.5 p-2.5 bg-white border border-stone-200 rounded-sm">
                    <label className="text-[9px] text-stone-700 font-bold uppercase tracking-wider block">{label}</label>
                    <div className="flex items-center space-x-3">
                      {uploadingSlots[idx] ? (
                        <div className="w-14 h-16 bg-stone-100 border border-stone-200 rounded-sm flex items-center justify-center flex-shrink-0">
                          <Loader2 className="h-5 w-5 text-stone-500 animate-spin" />
                        </div>
                      ) : productImages[idx] ? (
                        <div className="relative w-14 h-16 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0 shadow-xs">
                          <img src={productImages[idx]} alt={`Photo ${idx + 1}`} className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 shadow-sm hover:opacity-90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-16 border border-dashed border-stone-300 rounded-sm flex flex-col items-center justify-center text-stone-400 flex-shrink-0 text-[9px] font-bold gap-1">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Slot {idx + 1}</span>
                        </div>
                      )}
                      <div className="flex-grow space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingSlots[idx]}
                          onChange={(e) => handleSingleImageUpload(idx, e)}
                          className="w-full text-[11px] text-stone-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-sm file:border-0 file:text-[9px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90 disabled:opacity-50"
                        />
                        <input
                          type="text"
                          placeholder={`Or paste photo ${idx + 1} URL...`}
                          value={productImages[idx]?.startsWith('data:') ? '' : productImages[idx] || ''}
                          onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 px-2.5 py-1 text-[11px] focus:outline-none focus:border-stone-900 rounded-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inventory */}
              <div className="bg-stone-50 p-3 rounded-sm border border-stone-200/60">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block border-b pb-1 mb-2">Inventory Stock Levels</span>
                <div className="grid grid-cols-5 gap-2.5">
                  {[['S', stockS, setStockS], ['M', stockM, setStockM], ['L', stockL, setStockL], ['XL', stockXL, setStockXL], ['XXL', stockXXL, setStockXXL]].map(([sz, val, setter]: any) => (
                    <div key={sz} className="space-y-1">
                      <label className="text-[9px] font-bold text-center block">{sz}</label>
                      <input
                        type="number"
                        min="0"
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full bg-white border border-stone-200 px-2 py-1 text-center focus:outline-none focus:border-stone-950 rounded-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-opacity rounded-xs shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {saveLoading ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
