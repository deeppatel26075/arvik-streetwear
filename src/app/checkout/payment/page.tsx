'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Check, Lock, CreditCard, ShieldCheck, Zap } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
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

  // Load Razorpay SDK script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  if (cart.length === 0) {
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!shipping) return;
    setErrorMsg(null);
    setLoading(true);

    const totalAmount = getCartTotal();

    try {
      // 1. CASH ON DELIVERY (COD) FLOW
      if (paymentMethod === 'cod') {
        const orderId = `ARVIIK${Math.floor(100000 + Math.random() * 900000)}`;

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
          total_amount: totalAmount,
          status: 'pending',
          payment_method: 'COD',
          order_items: cart.map(item => ({
            size: item.size,
            quantity: item.quantity,
            price: item.discountPrice || item.price,
            products: { name: item.name }
          }))
        };

        const existingOrders = JSON.parse(localStorage.getItem('arviik_custom_orders') || '[]');
        localStorage.setItem('arviik_custom_orders', JSON.stringify([localOrder, ...existingOrders]));

        clearCart();
        localStorage.removeItem('arviik_shipping');

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });

        router.push(`/checkout/success?orderId=${orderId}&email=${shipping.email}&total=${totalAmount}`);
        return;
      }

      // 2. RAZORPAY ONLINE PAYMENT FLOW
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Call backend route to generate Razorpay Order ID
      let razorpayOrderId = null;
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'INR',
          }),
        });

        const data = await res.json();
        if (data.id) {
          razorpayOrderId = data.id;
        }
      } catch (err) {
        console.warn('API checkout order creation fallback:', err);
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123';

      const options: any = {
        key: razorpayKey,
        amount: Math.round(totalAmount * 100), // in paise
        currency: 'INR',
        name: 'ARVIIK STREETWEAR',
        description: 'Payment for Streetwear Order',
        image: '/arviik-logo.png',
        order_id: razorpayOrderId || undefined,
        prefill: {
          name: shipping.name,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: {
          color: '#09090b',
        },
        handler: async function (response: any) {
          setLoading(true);
          try {
            // Verify signature backend call
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
                razorpay_order_id: response.razorpay_order_id || razorpayOrderId || `order_mock_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'mock_signature',
                shipping,
                items: cart,
                total: totalAmount,
                couponId: coupon?.code,
                userId: user?.id,
              }),
            });

            const verifyData = await verifyRes.json();
            const finalOrderId = verifyData.orderId || `ARVIIK${Math.floor(100000 + Math.random() * 900000)}`;

            // Save order locally for immediate dashboard display
            const localOrder = {
              id: finalOrderId,
              created_at: new Date().toISOString(),
              shipping_name: shipping.name,
              shipping_email: shipping.email,
              shipping_phone: shipping.phone,
              shipping_address: shipping.address,
              shipping_city: shipping.city,
              shipping_state: shipping.state,
              shipping_pincode: shipping.pincode,
              total_amount: totalAmount,
              status: 'pending',
              payment_method: 'Razorpay Online',
              razorpay_payment_id: response.razorpay_payment_id,
              order_items: cart.map(item => ({
                size: item.size,
                quantity: item.quantity,
                price: item.discountPrice || item.price,
                products: { name: item.name }
              }))
            };

            const existingOrders = JSON.parse(localStorage.getItem('arviik_custom_orders') || '[]');
            localStorage.setItem('arviik_custom_orders', JSON.stringify([localOrder, ...existingOrders]));

            clearCart();
            localStorage.removeItem('arviik_shipping');

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });

            router.push(`/checkout/success?orderId=${finalOrderId}&email=${shipping.email}&total=${totalAmount}`);
          } catch (verifyError: any) {
            console.error('Verification error:', verifyError);
            setErrorMsg(verifyError.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        console.error('Razorpay Payment Failed:', response.error);
        setErrorMsg(`Payment failed: ${response.error.description || 'Transaction cancelled.'}`);
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('Order placement error:', err);
      setErrorMsg(err.message || 'An error occurred during order processing.');
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
          <span>Back to Shipping</span>
        </Link>
      </div>

      {/* Progress steps */}
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
          <span className="uppercase tracking-wider text-[9px]">Confirmation</span>
        </div>
      </div>

      <h1 className="font-bold text-sm uppercase tracking-widest text-[#111111] pt-2">
        SELECT PAYMENT METHOD
      </h1>

      {/* Payment Options */}
      <div className="space-y-3">
        {/* Razorpay Online Option */}
        <label
          className={`flex items-start justify-between p-4 rounded-xs border cursor-pointer transition-all ${
            paymentMethod === 'razorpay'
              ? 'border-stone-900 bg-stone-50/70 shadow-xs'
              : 'border-stone-200 bg-white'
          }`}
        >
          <div className="flex items-start space-x-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'razorpay'}
              onChange={() => setPaymentMethod('razorpay')}
              className="mt-0.5 text-stone-950 focus:ring-stone-950 h-4 w-4"
            />
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                  Razorpay Secure Payment
                </span>
                <span className="bg-blue-50 text-blue-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-widest border border-blue-100 flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5 fill-current" /> Instant
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards, NetBanking & Wallets.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Supports:</span>
                <span className="text-[9px] font-bold text-stone-600 uppercase tracking-wider bg-stone-100 px-1.5 py-0.5 rounded-xs">UPI</span>
                <span className="text-[9px] font-bold text-stone-600 uppercase tracking-wider bg-stone-100 px-1.5 py-0.5 rounded-xs">GPay</span>
                <span className="text-[9px] font-bold text-stone-600 uppercase tracking-wider bg-stone-100 px-1.5 py-0.5 rounded-xs">Cards</span>
                <span className="text-[9px] font-bold text-stone-600 uppercase tracking-wider bg-stone-100 px-1.5 py-0.5 rounded-xs">NetBanking</span>
              </div>
            </div>
          </div>
          <CreditCard className="h-5 w-5 text-stone-700 flex-shrink-0 mt-0.5" />
        </label>

        {/* Cash on Delivery Option */}
        <label
          className={`flex items-center justify-between p-4 rounded-xs border cursor-pointer transition-all ${
            paymentMethod === 'cod'
              ? 'border-stone-900 bg-stone-50/70 shadow-xs'
              : 'border-stone-200 bg-white'
          }`}
        >
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
              className="text-stone-950 focus:ring-stone-950 h-4 w-4"
            />
            <div>
              <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider block">
                Cash on Delivery (COD)
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                Pay in cash upon doorstep delivery.
              </span>
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 text-stone-700 flex-shrink-0" />
        </label>
      </div>

      {/* Summary Block */}
      <div className="space-y-4 pt-4 border-t border-stone-200">
        <h2 className="font-bold text-xs uppercase tracking-widest text-stone-900">
          ORDER SUMMARY
        </h2>
        <div className="space-y-2 text-xs font-semibold text-stone-600">
          <div className="flex justify-between">
            <span>{totalItemCount} Items</span>
            <span className="text-stone-900">{formatPrice(getCartSubtotal())}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount ({coupon.code})</span>
              <span>-{formatPrice(getDiscountAmount())}</span>
            </div>
          )}
          <div className="flex justify-between pb-2 border-b border-stone-200">
            <span>Shipping</span>
            <span className="text-stone-900">
              {getShippingFee() === 0 ? 'Free' : formatPrice(getShippingFee())}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold text-stone-950 pt-1">
            <span>Total Payable</span>
            <span className="text-base font-extrabold">{formatPrice(getCartTotal())}</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-[11px] text-red-800 font-bold uppercase tracking-wider">
          {errorMsg}
        </div>
      )}

      {/* CTA Button */}
      <div className="pt-2 text-center space-y-3">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs tracking-widest uppercase py-4 rounded-xs shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>
            {loading
              ? 'Processing Payment...'
              : paymentMethod === 'razorpay'
              ? `PAY ${formatPrice(getCartTotal())} VIA RAZORPAY`
              : `PLACE COD ORDER (${formatPrice(getCartTotal())})`}
          </span>
        </button>
        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Lock className="h-3 w-3 text-stone-400" />
          <span>256-Bit Encrypted Secure Razorpay Checkout</span>
        </p>
      </div>
    </div>
  );
}
