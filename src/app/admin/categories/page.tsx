'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { adminDbQuery } from '@/lib/adminApi';
import { Plus, Trash2, Check, RefreshCw, X, FolderOpen } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      let loadedCats = [];

      // Try fetching from Supabase first
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        if (data && data.length > 0) {
          loadedCats = data;
          localStorage.setItem('arviik_custom_categories', JSON.stringify(data));
        } else {
          // If query worked but returned empty, check local storage
          const storedCats = localStorage.getItem('arviik_custom_categories');
          if (storedCats) loadedCats = JSON.parse(storedCats);
        }
      } catch (dbErr) {
        console.error('Failed to load DB categories, checking local cache:', dbErr);
        const storedCats = localStorage.getItem('arviik_custom_categories');
        if (storedCats) {
          loadedCats = JSON.parse(storedCats);
        }
      }

      // If absolutely no categories (even in cache), set default ones
      if (loadedCats.length === 0) {
        loadedCats = [
          { id: 'cat-001', name: 'Graphic Prints', slug: 'graphic-prints' },
          { id: 'cat-002', name: 'Minimalist Typo', slug: 'minimalist-typo' }
        ];
        localStorage.setItem('arviik_custom_categories', JSON.stringify(loadedCats));
      }

      setCategories(loadedCats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Sync slug auto-generation on name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    setStatusMsg({ type: '', text: '' });

    const newCategoryPayload = {
      name: name.trim(),
      slug: slug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    };

    const localId = `cat-${Math.random().toString(36).substr(2, 9)}`;
    const mockCategory = {
      id: localId,
      ...newCategoryPayload,
      created_at: new Date().toISOString(),
    };

    try {
      // Try writing to Supabase via admin API
      const insertRes = await adminDbQuery('categories', 'insert', newCategoryPayload);
      const data = insertRes.data[0];

      if (data) {
        const updated = [...categories, data].sort((a, b) => a.name.localeCompare(b.name));
        setCategories(updated);
        localStorage.setItem('arviik_custom_categories', JSON.stringify(updated));
      }
      setStatusMsg({ type: 'success', text: `Category "${name}" created successfully in Database!` });
    } catch (err) {
      console.warn('Supabase Category write skipped/failed, fallback to localStorage:', err);
      
      // Local Fallback
      const updated = [...categories, mockCategory].sort((a, b) => a.name.localeCompare(b.name));
      setCategories(updated);
      localStorage.setItem('arviik_custom_categories', JSON.stringify(updated));
      setStatusMsg({ type: 'success', text: `Category "${name}" saved locally (Demo mode).` });
    } finally {
      setName('');
      setSlug('');
      setAdding(false);
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"? This might orphan products belonging to it.`)) {
      return;
    }

    setDeletingId(id);
    setStatusMsg({ type: '', text: '' });

    try {
      // Try deleting from Supabase via admin API
      await adminDbQuery('categories', 'delete', null, { id });

      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      localStorage.setItem('arviik_custom_categories', JSON.stringify(updated));
      setStatusMsg({ type: 'success', text: `Category "${catName}" deleted successfully.` });
    } catch (err) {
      console.warn('Supabase Category delete skipped/failed, fallback to localStorage:', err);
      
      // Local Fallback
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      localStorage.setItem('arviik_custom_categories', JSON.stringify(updated));
      setStatusMsg({ type: 'success', text: `Category "${catName}" removed locally.` });
    } finally {
      setDeletingId(null);
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
          Category Manager
        </h1>
        <p className="text-xs text-stone-500 font-light mt-0.5">Manage apparel types and shop catalog groupings dynamically.</p>
      </div>

      {statusMsg.text && (
        <div className={`text-[11px] font-semibold p-3 border rounded-xs flex items-center space-x-1.5 uppercase tracking-wider max-w-4xl ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
            : 'bg-red-50 text-red-800 border-red-100'
        }`}>
          <Check className="h-4 w-4" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Create Category Form */}
        <form onSubmit={handleAddCategory} className="lg:col-span-5 bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs space-y-4 text-xs font-semibold text-stone-850">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 font-syne">
            Add New Category
          </span>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Graphic Prints, Minimalist Typo"
              value={name}
              onChange={handleNameChange}
              className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Slug (Auto-generated)</label>
            <input
              type="text"
              required
              placeholder="e.g., winter-oversized"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
              className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={adding}
            className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2 shadow-sm font-sans"
          >
            {adding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Creating Category...</span>
              </>
            ) : (
              <>
                <Plus className="h-4.5 w-4.5" />
                <span>Create Category</span>
              </>
            )}
          </button>
        </form>

        {/* Categories List */}
        <div className="lg:col-span-7 bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block border-b pb-1.5 mb-4 font-syne">
            Existing Categories
          </span>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
              <span>Retrieving categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 text-stone-400 font-medium tracking-wide">
              No categories found.
            </div>
          ) : (
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-xs text-stone-650">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] text-stone-455 font-bold uppercase tracking-wider">
                    <th className="pb-3">Category Name</th>
                    <th className="pb-3">Slug / Path</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-stone-50/50">
                      <td className="py-4 font-semibold text-stone-900 uppercase tracking-wide">
                        {cat.name}
                      </td>
                      <td className="py-4 font-mono text-stone-500">
                        {cat.slug}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          disabled={deletingId === cat.id}
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 text-stone-400 hover:text-red-750 transition-colors disabled:opacity-50"
                          title="Delete Category"
                        >
                          {deletingId === cat.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
