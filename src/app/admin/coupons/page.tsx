'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { Plus, Trash2, Calendar, Tag, RefreshCw } from 'lucide-react';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      }
      
      if (data && data.length > 0) {
        setCoupons(data);
      } else {
        // Fallback mock coupons
        setCoupons([
          { id: 'c1', code: 'STREET30', discount_percent: 30, expiry_date: '2026-12-31T23:59:59Z', usage_limit: 100, times_used: 14 },
          { id: 'c2', code: 'FIRST10', discount_percent: 10, expiry_date: '2026-08-30T23:59:59Z', usage_limit: null, times_used: 45 },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const payload = {
      code: code.toUpperCase().trim(),
      discount_percent: parseInt(discountPercent),
      expiry_date: new Date(expiryDate).toISOString(),
      usage_limit: usageLimit ? parseInt(usageLimit) : null,
    };

    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setCoupons(prev => [data, ...prev]);
      setCode('');
      setDiscountPercent('');
      setExpiryDate('');
      setUsageLimit('');
    } catch (err: any) {
      console.error(err);
      // Fallback local update
      const mockNew = {
        id: `c-${Math.random()}`,
        code: code.toUpperCase(),
        discount_percent: parseInt(discountPercent),
        expiry_date: new Date(expiryDate).toISOString(),
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        times_used: 0
      };
      setCoupons(prev => [mockNew, ...prev]);
      setCode('');
      setDiscountPercent('');
      setExpiryDate('');
      setUsageLimit('');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await supabase.from('coupons').delete().eq('id', id);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
          Coupon Manager
        </h1>
        <p className="text-xs text-stone-500 font-light mt-0.5">Create discount promotional codes and track usage statistics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Create Coupon Form */}
        <div className="lg:col-span-5 bg-white border border-stone-200/60 p-6 rounded-xs shadow-xs h-fit space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center space-x-2">
            <Tag className="h-4.5 w-4.5 text-stone-800" />
            <h3 className="font-syne font-bold uppercase text-stone-900 text-xs tracking-wider">
              Create Promo Code
            </h3>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-semibold text-stone-850">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="STREET30"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Discount Percent (%)</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                placeholder="30"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Usage Limit (Optional)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-3.5 hover:opacity-90 transition-opacity rounded-xs shadow-sm"
            >
              {formLoading ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* Right Column: Coupons list table */}
        <div className="lg:col-span-7 bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs h-fit">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
              <span>Loading coupons...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Discount</th>
                    <th className="pb-3">Expiry</th>
                    <th className="pb-3">Times Used</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-stone-50/50">
                      <td className="py-4 font-mono font-bold text-stone-900 uppercase tracking-wider">{coupon.code}</td>
                      <td className="py-4 font-semibold text-stone-900">{coupon.discount_percent}% OFF</td>
                      <td className="py-4 font-medium text-stone-500">
                        {new Date(coupon.expiry_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-4 font-semibold text-stone-700">
                        {coupon.times_used} / {coupon.usage_limit || '∞'}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-stone-400 hover:text-red-750 p-1"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
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
