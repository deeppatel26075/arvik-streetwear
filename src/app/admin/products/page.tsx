'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/app/page';
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
  const [imageUrl1, setImageUrl1] = useState('');
  const [imageUrl2, setImageUrl2] = useState('');

  // Stock sizes
  const [stockS, setStockS] = useState('10');
  const [stockM, setStockM] = useState('15');
  const [stockL, setStockL] = useState('20');
  const [stockXL, setStockXL] = useState('10');
  const [stockXXL, setStockXXL] = useState('5');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, num: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (num === 1) {
        setImageUrl1(base64String);
      } else {
        setImageUrl2(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load products & categories
  const loadData = async () => {
    try {
      setLoading(true);

      // Check categories
      let loadedCats = [];
      const storedCats = localStorage.getItem('arviik_custom_categories');
      if (storedCats) {
        loadedCats = JSON.parse(storedCats);
      } else {
        try {
          const { data: cats } = await supabase.from('categories').select('*');
          if (cats && cats.length > 0) {
            loadedCats = cats;
            localStorage.setItem('arviik_custom_categories', JSON.stringify(cats));
          }
        } catch (catErr) {
          console.error('Failed to load DB categories:', catErr);
        }
      }
      if (loadedCats.length === 0) {
        loadedCats = [
          { id: 'cat-001', name: 'Graphic Prints', slug: 'graphic-prints' },
          { id: 'cat-002', name: 'Minimalist Typo', slug: 'minimalist-typo' }
        ];
        localStorage.setItem('arviik_custom_categories', JSON.stringify(loadedCats));
      }
      setCategories(loadedCats);

      // Check products
      let loadedProds = [];
      const storedProds = localStorage.getItem('arviik_custom_products');
      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        const hasOldMocks = parsed.some((p: any) => p.name === 'ARCHIVE-01 GRAPHIC TEE' || p.name === 'ESSENTIALS LOGO TEE');
        if (hasOldMocks) {
          loadedProds = MOCK_PRODUCTS.map(p => ({
            ...p,
            categoryName: p.category.name,
            images: p.product_images.map(img => img.image_url),
            sizes: p.inventory,
            inventory: p.inventory
          }));
          localStorage.setItem('arviik_custom_products', JSON.stringify(loadedProds));
        } else {
          loadedProds = parsed;
        }
      } else {
        try {
          const { data: prods } = await supabase
            .from('products')
            .select('*, category:categories(name), product_images(image_url), inventory(size, quantity)');

          if (prods && prods.length > 0) {
            loadedProds = prods.map((p) => ({
              ...p,
              categoryName: p.category?.name || 'Streetwear',
              images: p.product_images?.map((img: any) => img.image_url) || [],
              sizes: p.inventory || [],
            }));
            localStorage.setItem('arviik_custom_products', JSON.stringify(loadedProds));
          }
        } catch (prodErr) {
          console.error('Failed to load DB products:', prodErr);
        }
      }

      if (loadedProds.length === 0) {
        loadedProds = MOCK_PRODUCTS.map(p => ({
          ...p,
          categoryName: p.category.name,
          images: p.product_images.map(img => img.image_url),
          sizes: p.inventory,
          inventory: p.inventory
        }));
        localStorage.setItem('arviik_custom_products', JSON.stringify(loadedProds));
      }
      setProducts(loadedProds);
    } catch (e) {
      console.error('Error loading data:', e);
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
    setCategoryId(categories[0]?.id || 'cat-001');
    setFabric('100% Premium Cotton');
    setGsm('240 GSM');
    setFitType('Oversized Fit');
    setWashInstructions('Cold machine wash inside out. Do not iron print.');
    setImageUrl1('');
    setImageUrl2('');
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
    setCategoryId(prod.category_id || categories[0]?.id || 'cat-001');
    setFabric(prod.fabric || '100% Premium Cotton');
    setGsm(prod.gsm || '240 GSM');
    setFitType(prod.fit_type || 'Oversized Fit');
    setWashInstructions(prod.wash_instructions || 'Cold wash inside out');
    setImageUrl1(prod.images?.[0] || '');
    setImageUrl2(prod.images?.[1] || '');

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

    const mockNewItem = {
      id: editingId || `prod-${Math.random()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      price: parseFloat(price),
      discount_price: discountPrice ? parseFloat(discountPrice) : undefined,
      category: { name: categories.find(c => c.id === categoryId)?.name || 'Graphic Prints' },
      categoryName: categories.find(c => c.id === categoryId)?.name || 'Graphic Prints',
      category_id: categoryId,
      fabric,
      gsm,
      fit_type: fitType,
      wash_instructions: washInstructions,
      images: [imageUrl1, imageUrl2].filter(Boolean),
      product_images: [
        imageUrl1 ? { image_url: imageUrl1 } : null,
        imageUrl2 ? { image_url: imageUrl2 } : null
      ].filter(Boolean) as any[],
      sizes: [
        { size: 'S', quantity: parseInt(stockS) },
        { size: 'M', quantity: parseInt(stockM) },
        { size: 'L', quantity: parseInt(stockL) },
        { size: 'XL', quantity: parseInt(stockXL) },
        { size: 'XXL', quantity: parseInt(stockXXL) },
      ],
      inventory: [
        { size: 'S', quantity: parseInt(stockS) },
        { size: 'M', quantity: parseInt(stockM) },
        { size: 'L', quantity: parseInt(stockL) },
        { size: 'XL', quantity: parseInt(stockXL) },
        { size: 'XXL', quantity: parseInt(stockXXL) },
      ]
    };

    try {
      if (editingId) {
        // Edit product in Supabase if online
        const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
        if (error) throw error;

        await supabase.from('product_images').delete().eq('product_id', editingId);
        if (imageUrl1) await supabase.from('product_images').insert({ product_id: editingId, image_url: imageUrl1, display_order: 0 });
        if (imageUrl2) await supabase.from('product_images').insert({ product_id: editingId, image_url: imageUrl2, display_order: 1 });

        const sizesToUpdate = [
          { size: 'S', qty: parseInt(stockS) },
          { size: 'M', qty: parseInt(stockM) },
          { size: 'L', qty: parseInt(stockL) },
          { size: 'XL', qty: parseInt(stockXL) },
          { size: 'XXL', qty: parseInt(stockXXL) },
        ];
        for (const item of sizesToUpdate) {
          await supabase
            .from('inventory')
            .upsert({ product_id: editingId, size: item.size, quantity: item.qty }, { onConflict: 'product_id,size' });
        }
      } else {
        // Add new product in Supabase if online
        const { data: newProd, error: insertError } = await supabase
          .from('products')
          .insert(productPayload)
          .select('id')
          .single();

        if (insertError) throw insertError;

        const newId = newProd.id;
        mockNewItem.id = newId;

        if (imageUrl1) await supabase.from('product_images').insert({ product_id: newId, image_url: imageUrl1, display_order: 0 });
        if (imageUrl2) await supabase.from('product_images').insert({ product_id: newId, image_url: imageUrl2, display_order: 1 });

        const inventoryPayload = [
          { product_id: newId, size: 'S', quantity: parseInt(stockS) },
          { product_id: newId, size: 'M', quantity: parseInt(stockM) },
          { product_id: newId, size: 'L', quantity: parseInt(stockL) },
          { product_id: newId, size: 'XL', quantity: parseInt(stockXL) },
          { product_id: newId, size: 'XXL', quantity: parseInt(stockXXL) },
        ];
        await supabase.from('inventory').insert(inventoryPayload);
      }

      // Sync local storage as well
      const updated = editingId
        ? products.map((p) => (p.id === editingId ? { ...p, ...mockNewItem } : p))
        : [mockNewItem, ...products];
      setProducts(updated);
      localStorage.setItem('arviik_custom_products', JSON.stringify(updated));
      setFormOpen(false);
    } catch (err) {
      console.warn('Supabase DB write skipped/failed, applying changes locally in localStorage:', err);
      // Demo fallback: update state locally
      const updated = editingId
        ? products.map((p) => (p.id === editingId ? { ...p, ...mockNewItem } : p))
        : [mockNewItem, ...products];
      setProducts(updated);
      localStorage.setItem('arviik_custom_products', JSON.stringify(updated));
      setFormOpen(false);
    }
  };

  const toggleHide = async (id: string, currentHidden: boolean) => {
    try {
      await supabase.from('products').update({ is_hidden: !currentHidden }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update hidden state failed, applying locally');
    }
    const updated = products.map((p) => (p.id === id ? { ...p, is_hidden: !currentHidden } : p));
    setProducts(updated);
    localStorage.setItem('arviik_custom_products', JSON.stringify(updated));
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      await supabase.from('products').update({ is_featured: !currentFeatured }).eq('id', id);
    } catch (e) {
      console.warn('Supabase update featured state failed, applying locally');
    }
    const updated = products.map((p) => (p.id === id ? { ...p, is_featured: !currentFeatured } : p));
    setProducts(updated);
    localStorage.setItem('arviik_custom_products', JSON.stringify(updated));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed, applying locally');
    }
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('arviik_custom_products', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-200 pb-5 gap-4">
        <div>
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
            Catalog Manager
          </h1>
          <p className="text-xs text-stone-500 font-light mt-0.5">Add, edit, toggle visibility and manage stocks.</p>
        </div>

        <button
          onClick={openAddForm}
          className="inline-flex items-center space-x-1.5 bg-stone-950 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 rounded-sm shadow-md"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add T-Shirt</span>
        </button>
      </div>

      {/* Products list table */}
      <div className="bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
            <span>Loading database products...</span>
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
                      </td>
                      <td className="py-4 uppercase tracking-wider text-[10px] font-semibold text-stone-500">
                        {prod.categoryName}
                      </td>
                      <td className="py-4 font-mono font-semibold text-stone-900">
                        {formatPrice(prod.discount_price || prod.price)}
                      </td>
                      <td className="py-4 font-semibold text-stone-700">
                        {getSzStock('S')}/{getSzStock('M')}/{getSzStock('L')}/{getSzStock('XL')}/{getSzStock('XXL')}
                      </td>
                      <td className="py-4">
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
                          {prod.is_hidden ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                        <button
                          onClick={() => openEditForm(prod)}
                          className="p-1 text-stone-500 hover:text-stone-900"
                        >
                          <Edit2 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1 text-stone-400 hover:text-red-750"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
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

      {/* Add / Edit Drawer Modal overlay */}
      {formOpen && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl p-6 shadow-2xl flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3.5 mb-5">
              <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider">
                {editingId ? 'Edit product details' : 'Add new product'}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-stone-500 hover:text-stone-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-stone-850">
              
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Product Name</label>
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
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Description</label>
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
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Price (INR)</label>
                  <input
                    type="number"
                    required
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
                      <option key={c.id} value={c.id}>
                        {c.name}
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
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fabric Specs</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">GSM weight</label>
                  <input
                    type="text"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Wash Care Instructions</label>
                <input
                  type="text"
                  value={washInstructions}
                  onChange={(e) => setWashInstructions(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>

              {/* Image Upload / Links */}
              <div className="space-y-4 p-4 bg-stone-50 rounded-sm border border-stone-200/60">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block border-b pb-1 mb-2">Product Images</span>
                
                {/* Image 1 (Front View) */}
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Front View Image (Primary)</label>
                  <div className="flex items-center space-x-4">
                    {imageUrl1 ? (
                      <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                        <img src={imageUrl1} alt="Front View" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setImageUrl1('')}
                          className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-20 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[10px] font-bold">
                        No Image
                      </div>
                    )}
                    <div className="flex-grow space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 1)}
                        className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90"
                      />
                      <input
                        type="text"
                        placeholder="Or paste front image URL..."
                        value={imageUrl1.startsWith('data:') ? '' : imageUrl1}
                        onChange={(e) => setImageUrl1(e.target.value)}
                        className="w-full bg-white border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Image 2 (Back View) */}
                <div className="space-y-2">
                  <label className="text-[10px] text-stone-600 font-bold uppercase tracking-wider block">Back View Image (Optional)</label>
                  <div className="flex items-center space-x-4">
                    {imageUrl2 ? (
                      <div className="relative w-16 h-20 bg-stone-100 border border-stone-200 rounded-sm overflow-hidden flex-shrink-0">
                        <img src={imageUrl2} alt="Back View" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => setImageUrl2('')}
                          className="absolute top-1 right-1 bg-red-650 text-white rounded-full p-0.5 shadow-sm hover:opacity-90 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-20 border border-dashed border-stone-300 rounded-sm flex items-center justify-center text-stone-400 flex-shrink-0 text-[10px] font-bold">
                        No Image
                      </div>
                    )}
                    <div className="flex-grow space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 2)}
                        className="w-full text-xs text-stone-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-stone-950 file:text-white hover:file:opacity-90"
                      />
                      <input
                        type="text"
                        placeholder="Or paste back image URL..."
                        value={imageUrl2.startsWith('data:') ? '' : imageUrl2}
                        onChange={(e) => setImageUrl2(e.target.value)}
                        className="w-full bg-white border border-stone-200 px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Sizes */}
              <div className="bg-stone-50 p-3 rounded-sm border border-stone-200/60">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block border-b pb-1 mb-2">Inventory Stock levels</span>
                <div className="grid grid-cols-5 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-center block">S</label>
                    <input
                      type="number"
                      value={stockS}
                      onChange={(e) => setStockS(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2 py-1 text-center focus:outline-none focus:border-stone-950 rounded-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-center block">M</label>
                    <input
                      type="number"
                      value={stockM}
                      onChange={(e) => setStockM(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2 py-1 text-center focus:outline-none focus:border-stone-950 rounded-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-center block">L</label>
                    <input
                      type="number"
                      value={stockL}
                      onChange={(e) => setStockL(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2 py-1 text-center focus:outline-none focus:border-stone-950 rounded-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-center block">XL</label>
                    <input
                      type="number"
                      value={stockXL}
                      onChange={(e) => setStockXL(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2 py-1 text-center focus:outline-none focus:border-stone-950 rounded-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-center block">XXL</label>
                    <input
                      type="number"
                      value={stockXXL}
                      onChange={(e) => setStockXXL(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2 py-1 text-center focus:outline-none focus:border-stone-950 rounded-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-opacity rounded-xs shadow-sm"
              >
                {editingId ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
