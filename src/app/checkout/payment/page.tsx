'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShippingDetails {
  name: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, getCartSubtotal, getDiscountAmount, getShippingFee, getCartTotal, clearCart, coupon } = useCart();
  const [shipping, setShipping] = useState<ShippingDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('card');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('arviik_shipping');
      if (stored) {
        setShipping(JSON.parse(stored));
      } else {
        router.push('/checkout');
      }
    } catch (e) {
      console.error('Failed to parse shipping details:', e);
      router.push('/checkout');
    }
  }, [router]);

  if (cart.length === 0) {
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!shipping) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      // Simulate/Trigger order verification & recording
      const orderId = `ARVIIK${Math.floor(100000 + Math.random() * 900000)}`;

      // Save order locally
      const localOrder = {
        id: orderId,
        created_at: new Date().toISOString(),
        shipping_name: shipping.name,
        shipping_email: shipping.email,
        shipping_phone: shipping.phone,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_pincode: shipping.pincode,
        total_amount: getCartTotal(),
        status: 'pending',
        order_items: cart.map(item => ({
          size: item.size,
          quantity: item.quantity,
          price: item.discountPrice || item.price,
          products: { name: item.name }
        }))
      };
      const existingOrders = JSON.parse(localStorage.getItem('arviik_custom_orders') || '[]');
      localStorage.setItem('arviik_custom_orders', JSON.stringify([localOrder, ...existingOrders]));

      // Decrement inventory stock locally
      const storedProducts = localStorage.getItem('arviik_custom_products');
      if (storedProducts) {
        const productsList = JSON.parse(storedProducts);
        const updatedProducts = productsList.map((prod: any) => {
          const cartItemsForProduct = cart.filter(item => item.productId === prod.id);
          if (cartItemsForProduct.length > 0) {
            const updatedSizes = prod.inventory?.map((sizeItem: any) => {
              const matchedCartItem = cartItemsForProduct.find(item => item.size === sizeItem.size);
              if (matchedCartItem) {
                return {
                  ...sizeItem,
                  quantity: Math.max(0, sizeItem.quantity - matchedCartItem.quantity)
                };
              }
              return sizeItem;
            }) || [];
            return {
              ...prod,
              inventory: updatedSizes
            };
          }
          return prod;
        });
        localStorage.setItem('arviik_custom_products', JSON.stringify(updatedProducts));
      }

      clearCart();
      localStorage.removeItem('arviik_shipping');
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      router.push(`/checkout/success?orderId=${orderId}&email=${shipping.email}&total=${getCartTotal()}`);
    } catch (err: any) {
      console.error('Order placement failed:', err);
      setErrorMsg(err.message || 'An error occurred during order placement.');
    } finally {
      setLoading(false);
    }
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Return */}
      <div>
        <Link
          href="/checkout"
          className="inline-flex items-center space-x-1.5 text-xs text-[#666666] hover:text-[#111111] uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      {/* Progress steps mapping the design exactly */}
      <div className="flex items-center justify-center space-x-6 pb-2 border-b border-[#ECECEC]">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#16A34A]">
          <span className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px]">
            <Check className="w-3 h-3" />
          </span>
          <span className="uppercase tracking-wider text-[9px]">Shipping</span>
        </div>
        <div className="h-[1px] w-8 bg-[#16A34A]" />
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#111111]">
          <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px]">2</span>
          <span className="uppercase tracking-wider text-[9px]">Payment</span>
        </div>
        <div className="h-[1px] w-8 bg-[#ECECEC]" />
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#666666]">
          <span className="w-5 h-5 rounded-full bg-[#F7F7F7] border border-[#ECECEC] text-[#666666] flex items-center justify-center text-[10px]">3</span>
          <span className="uppercase tracking-wider text-[9px]">Review</span>
        </div>
      </div>

      <h1 className="font-bold text-sm uppercase tracking-widest text-[#111111] pt-2">
        PAYMENT METHOD
      </h1>

      {/* Payment Options */}
      <div className="space-y-3">
        {[
          { id: 'upi', label: 'UPI' },
          { id: 'card', label: 'Credit / Debit Card' },
          { id: 'netbanking', label: 'Net Banking' },
          { id: 'cod', label: 'Cash on Delivery' }
        ].map((method) => (
          <label
            key={method.id}
            className={`flex items-center space-x-3 p-4 rounded-[10px] border cursor-pointer transition-all ${
              paymentMethod === method.id
                ? 'border-[#111111] bg-[#F7F7F7]'
                : 'border-[#ECECEC] bg-white'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === method.id as any}
              onChange={() => setPaymentMethod(method.id as any)}
              className="text-[#111111] focus:ring-[#111111] h-4 w-4"
            />
            <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">{method.label}</span>
          </label>
        ))}
      </div>

      {/* Summary Block */}
      <div className="space-y-4 pt-4 border-t border-[#ECECEC]">
        <h2 className="font-bold text-xs uppercase tracking-widest text-[#111111]">
          ORDER SUMMARY
        </h2>
        <div className="space-y-2 text-xs font-semibold text-[#666666]">
          <div className="flex justify-between">
            <span>{totalItemCount} Items</span>
            <span className="text-[#111111]">{formatPrice(getCartSubtotal())}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-[#16A34A]">
              <span>Discount</span>
              <span>-{formatPrice(getDiscountAmount())}</span>
            </div>
          )}
          <div className="flex justify-between pb-2 border-b border-[#ECECEC]">
            <span>Shipping</span>
            <span className="text-[#111111]">
              {getShippingFee() === 0 ? 'Free' : formatPrice(getShippingFee())}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-[#111111] pt-1">
            <span>Total</span>
            <span>{formatPrice(getCartTotal())}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-[10px] text-[#DC2626] font-bold uppercase tracking-wider">
          {errorMsg}
        </p>
      )}

      {/* CTA Button */}
      <div className="pt-2 text-center space-y-3">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="apple-button w-full text-xs tracking-widest uppercase shadow-xs"
        >
          {loading ? 'Placing Order...' : 'PLACE ORDER'}
        </button>
        <p className="text-[9px] text-[#666666] font-bold uppercase tracking-widest flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          <span>100% Secure Checkout</span>
        </p>
      </div>
    </div>
  );
}
