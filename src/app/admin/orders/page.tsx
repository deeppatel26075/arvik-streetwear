'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { RefreshCw, ClipboardList, Info } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load orders:', error);
      } else {
        setOrders(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Failed to update order status: ' + error.message);
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-800 border-red-100';
      case 'shipped': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'packing': return 'bg-purple-50 text-purple-800 border-purple-100';
      default: return 'bg-stone-100 text-stone-850 border-stone-200/50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
          Order Manager
        </h1>
        <p className="text-xs text-stone-500 font-light mt-0.5">Track shipment states and process customer delivery workflows.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Orders list table */}
        <div className="lg:col-span-8 bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs h-fit">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-stone-400 text-xs font-bold uppercase tracking-widest space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
              <span>Loading orders...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400 text-xs font-semibold uppercase tracking-wider">
                        No orders placed yet. Customer orders will appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50">
                        <td className="py-4 font-mono font-semibold text-stone-900">{order.id}</td>
                        <td className="py-4 font-medium text-stone-850">{order.shipping_name}</td>
                        <td className="py-4 font-semibold text-stone-900">{formatPrice(order.total_amount)}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-stone-400 hover:text-stone-900 p-1 transition-colors"
                          >
                            <Info className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Active Order Details Control panel */}
        <div className="lg:col-span-4 space-y-6">
          {selectedOrder ? (
            <div className="bg-white border border-stone-200/60 p-6 rounded-xs shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <span className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider">
                  Order Details
                </span>
                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-2.5 text-xs text-stone-600">
                <p className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">Customer Contact</p>
                <div className="space-y-1">
                  <p><strong className="font-semibold text-stone-850">Name:</strong> {selectedOrder.shipping_name}</p>
                  <p><strong className="font-semibold text-stone-850">Email:</strong> {selectedOrder.shipping_email}</p>
                  <p><strong className="font-semibold text-stone-850">Phone:</strong> {selectedOrder.shipping_phone}</p>
                  <p><strong className="font-semibold text-stone-850">Address:</strong> {selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_state} - {selectedOrder.shipping_pincode}</p>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="space-y-2.5 text-xs text-stone-600">
                <p className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">Items Purchased</p>
                <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto pr-1">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 first:pt-0">
                      <div>
                        <p className="font-semibold text-stone-900 uppercase tracking-wide line-clamp-1">
                          {item.products?.name || 'Streetwear Tee'}
                        </p>
                        <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-0.5">Size: {item.size} | Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-stone-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Status Controls */}
              <div className="space-y-2.5 pt-4 border-t border-stone-100">
                <p className="font-bold text-[10px] text-stone-400 uppercase tracking-wider">Update Order State</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'accepted')}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded-sm border border-stone-200/50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'packing')}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded-sm border border-stone-200/50"
                  >
                    Packing
                  </button>
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded-sm border border-stone-200/50"
                  >
                    Ship
                  </button>
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-sm"
                  >
                    Deliver
                  </button>
                  <button
                    onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                    className="bg-red-50 hover:bg-red-100 text-red-800 py-2 rounded-sm border border-red-200/50 col-span-2 mt-1"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-sm p-6 text-center text-stone-400 text-xs font-semibold uppercase tracking-wider py-16 flex flex-col items-center justify-center space-y-2">
              <ClipboardList className="h-8 w-8 text-stone-300" />
              <span>Select an order to view details & update status</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
