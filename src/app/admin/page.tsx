'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { DollarSign, ShoppingCart, Users, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch local custom orders if any
        let localOrders: any[] = [];
        try {
          const stored = localStorage.getItem('arviik_custom_orders');
          if (stored) {
            localOrders = JSON.parse(stored).filter((o: any) => o.id !== 'ORD-89472' && o.id !== 'ORD-89469' && o.id !== 'ORD-89468');
          }
        } catch (e) {}

        // 1. Fetch metrics from Supabase
        const { data: orders } = await supabase
          .from('orders')
          .select('*, profiles(full_name)');
        
        const { data: inventory } = await supabase
          .from('inventory')
          .select('*')
          .lt('quantity', 5);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'customer');

        const allOrders = [...localOrders, ...(orders || [])];

        if (allOrders.length > 0) {
          // Calculate revenue
          const totalPaid = allOrders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
          
          const pending = allOrders.filter(o => o.status === 'pending').length;

          const todayStr = new Date().toISOString().split('T')[0];
          const todayRevenue = allOrders
            .filter(o => o.created_at && o.created_at.startsWith(todayStr) && o.status !== 'cancelled')
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

          setMetrics({
            todayRevenue,
            monthlyRevenue: totalPaid,
            totalOrders: allOrders.length,
            pendingOrders: pending,
            totalCustomers: profiles?.length || 0,
            lowStockCount: inventory?.length || 0,
          });

          // Set recent orders list
          const formattedOrders = allOrders
            .slice(0, 5)
            .map(o => ({
              id: o.id,
              name: o.shipping_name || 'Customer',
              total: o.total_amount || 0,
              status: o.status || 'pending',
              date: o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : 'Today',
            }));
          setRecentOrders(formattedOrders);
        } else {
          setMetrics({
            todayRevenue: 0,
            monthlyRevenue: 0,
            totalOrders: 0,
            pendingOrders: 0,
            totalCustomers: profiles?.length || 0,
            lowStockCount: inventory?.length || 0,
          });
          setRecentOrders([]);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { name: "Today's Revenue", value: formatPrice(metrics.todayRevenue), icon: DollarSign, color: 'text-stone-900', bg: 'bg-stone-50' },
    { name: "Monthly Revenue", value: formatPrice(metrics.monthlyRevenue), icon: TrendingUp, color: 'text-stone-900', bg: 'bg-stone-50' },
    { name: "Total Orders", value: metrics.totalOrders.toString(), icon: ShoppingCart, color: 'text-stone-900', bg: 'bg-stone-50' },
    { name: "Pending Orders", value: metrics.pendingOrders.toString(), icon: RefreshCw, color: 'text-amber-800 bg-amber-50', bg: 'bg-stone-50' },
    { name: "Total Customers", value: metrics.totalCustomers.toString(), icon: Users, color: 'text-stone-900', bg: 'bg-stone-50' },
    { name: "Low Stock Warning", value: metrics.lowStockCount.toString(), icon: AlertTriangle, color: metrics.lowStockCount > 0 ? 'text-red-800 bg-red-50' : 'text-stone-400', bg: 'bg-stone-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
          Executive Dashboard
        </h1>
        <p className="text-xs text-stone-500 font-light mt-0.5">Real-time sales & storefront monitoring metrics.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white border border-stone-200/60 rounded-xs p-6 flex items-center justify-between shadow-xs"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                  {stat.name}
                </span>
                <p className="text-2xl font-extrabold text-stone-900">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity / Table */}
      <div className="bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs">
        <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider pb-3 border-b border-stone-100 mb-4">
          Recent Orders
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Total Paid</th>
                <th className="pb-3">Order Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 text-xs font-semibold uppercase tracking-wider">
                    No orders recorded yet. New customer orders will be listed here.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order, index) => (
                  <tr key={index} className="hover:bg-stone-50/50">
                    <td className="py-3.5 font-mono text-stone-900 font-semibold">{order.id}</td>
                    <td className="py-3.5 text-stone-850 font-medium">{order.name}</td>
                    <td className="py-3.5 font-semibold text-stone-900">{formatPrice(order.total)}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                        order.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                        'bg-stone-100 text-stone-850 border-stone-200'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-medium">{order.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
