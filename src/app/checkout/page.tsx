'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, ArrowLeft, CreditCard, Tag, Check, QrCode, X, ShieldCheck, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    cart,
    coupon,
    clearCart,
    getCartSubtotal,
    getDiscountAmount,
    getShippingFee,
    getCartTotal,
  } = useCart();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);

  // Payment config & states
  const [paymentConfig, setPaymentConfig] = useState<any>({ payment_mode: 'simulation' });
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorTab, setSimulatorTab] = useState<'upi' | 'card'>('upi');
  const [mockOrderId, setMockOrderId] = useState('');

  // Load payment config settings
  useEffect(() => {
    const loadPaymentConfig = async () => {
      try {
        const local = localStorage.getItem('arviik_custom_settings');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.payment_config) {
            setPaymentConfig(parsed.payment_config);
          }
        }
        const { data } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'payment_config')
          .single();
        if (data && data.value) {
          setPaymentConfig(data.value);
        }
      } catch (err) {
        console.warn('Failed to load payment config settings:', err);
      }
    };
    loadPaymentConfig();
  }, []);

  const saveOrderLocally = (orderId: string, method: string) => {
    try {
      const localOrder = {
        id: orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString(),
        shipping_name: name,
        shipping_email: email,
        shipping_phone: phone,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_pincode: pincode,
        total_amount: getCartTotal(),
        status: method === 'cod' ? 'cod_pending' : 'pending',
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
            const updatedSizes = prod.sizes?.map((sizeItem: any) => {
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
              sizes: updatedSizes,
              inventory: updatedSizes
            };
          }
          return prod;
        });
        localStorage.setItem('arviik_custom_products', JSON.stringify(updatedProducts));
      }
    } catch (e) {
      console.error('Failed to update local order cache/inventory:', e);
    }
  };

  const handleSimulatedPayment = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const simulatedPaymentId = `pay_mock_${Math.floor(100000 + Math.random() * 900000)}`;
      
      const verifyRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: simulatedPaymentId,
          razorpay_order_id: mockOrderId,
          razorpay_signature: 'mock_signature',
          shipping: { name, email, phone, address, city, state, pincode },
          items: cart,
          total: getCartTotal(),
          couponId: coupon ? coupon.code : null,
          userId: user?.id || null,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Failed to verify simulated payment');
      }

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      saveOrderLocally(verifyData.orderId, 'online');

      setCompletedOrderDetails({
        orderId: verifyData.orderId,
        email,
        total: getCartTotal(),
      });
      setShowSimulator(false);
      setOrderCompleted(true);
      clearCart();
    } catch (err: any) {
      console.error('Simulated verification failed:', err);
      setErrorMsg(err.message || 'Simulated payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  // Autofill if user is logged in and has profile data
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setEmail(user?.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.shipping_address || '');
      setCity(profile.shipping_city || '');
      setState(profile.shipping_state || '');
      setPincode(profile.shipping_pincode || '');
    }
  }, [profile, user]);

  if (cart.length === 0 && !orderCompleted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <p className="text-stone-400 text-sm font-semibold uppercase tracking-widest">
          Your bag is empty. Add items to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-block text-xs bg-stone-900 text-white font-bold uppercase tracking-widest px-8 py-3.5 hover:opacity-85 transition-opacity"
        >
          View Collection
        </Link>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
      setErrorMsg('Please complete all fields');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    // 1. Cash on Delivery (COD) Checkout route
    if (paymentMethod === 'cod') {
      try {
        const verifyRes = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_payment_id: 'pay_cod',
            razorpay_order_id: `order_cod_${Math.floor(100000 + Math.random() * 900000)}`,
            razorpay_signature: 'mock_signature',
            shipping: { name, email, phone, address, city, state, pincode },
            items: cart,
            total: getCartTotal(),
            couponId: coupon ? coupon.code : null,
            userId: user?.id || null,
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'Failed to place COD order');
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });

        const orderIdVal = verifyData.orderId || `ORD-COD-${Math.floor(100000 + Math.random() * 900000)}`;
        saveOrderLocally(orderIdVal, 'cod');

        setCompletedOrderDetails({
          orderId: orderIdVal,
          email,
          total: getCartTotal(),
        });
        setOrderCompleted(true);
        clearCart();
      } catch (err: any) {
        console.error('COD placement failed:', err);
        setErrorMsg(err.message || 'Failed to record Cash on Delivery order.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Online Payment Checkout route
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: getCartTotal(),
          currency: 'INR',
          email,
          name,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.id) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      const isLive = paymentConfig.payment_mode === 'live';

      if (!isLive) {
        // Simulation mode: Open custom payment simulator modal
        setMockOrderId(orderData.id);
        setShowSimulator(true);
        setLoading(false);
        return;
      }

      // Live mode: Open official Razorpay modal
      const options = {
        key: paymentConfig.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ARVIIK Streetwear',
        description: 'Order Payment',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=150',
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                shipping: { name, email, phone, address, city, state, pincode },
                items: cart,
                total: getCartTotal(),
                couponId: coupon ? coupon.code : null,
                userId: user?.id || null,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Signature verification failed');
            }

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
            });

            saveOrderLocally(verifyData.orderId, 'online');

            setCompletedOrderDetails({
              orderId: verifyData.orderId,
              email,
              total: getCartTotal(),
            });
            setOrderCompleted(true);
            clearCart();
          } catch (err: any) {
            console.error('Payment processing failed:', err);
            setErrorMsg(err.message || 'Payment signature verification failed.');
          } finally {
            setLoading(false);
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: '#0c0c0b' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        setErrorMsg('Payment transaction failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setErrorMsg(err.message || 'An error occurred during checkout setup.');
      setLoading(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.25em]">
            Order Successful
          </span>
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900">
            Thank you for your order
          </h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Order Reference: <strong className="font-semibold text-stone-800">{completedOrderDetails?.orderId}</strong>
            <br />
            A confirmation email has been logged to {completedOrderDetails?.email}.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop"
            className="text-xs bg-stone-900 text-white font-bold uppercase tracking-widest px-8 py-3.5 hover:opacity-85 transition-opacity"
          >
            Continue Shopping
          </Link>
          <Link
            href="/profile"
            className="text-xs border border-stone-300 text-stone-700 font-bold uppercase tracking-widest px-8 py-3.5 hover:border-stone-900 transition-colors"
          >
            Track Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Return button */}
      <div className="mb-8">
        <Link
          href="/shop"
          className="inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-stone-900 uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to shop</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left column: Shipping Details form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-syne font-extrabold text-xl uppercase tracking-wider text-stone-900">
              Delivery Information
            </h2>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Karan Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="karan@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                Street Address
              </label>
              <input
                type="text"
                required
                placeholder="Apartment, suite, unit, building, street, etc."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  required
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  placeholder="400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                Acquisition Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`flex items-center justify-between p-4 border rounded-sm transition-all text-xs font-semibold ${
                    paymentMethod === 'online'
                      ? 'border-stone-950 bg-stone-950 text-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-850 hover:border-stone-400'
                  }`}
                >
                  <span className="uppercase tracking-wider">ONLINE ACQUISITION</span>
                  <CreditCard className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center justify-between p-4 border rounded-sm transition-all text-xs font-semibold ${
                    paymentMethod === 'cod'
                      ? 'border-stone-950 bg-stone-950 text-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-850 hover:border-stone-400'
                  }`}
                >
                  <span className="uppercase tracking-wider">CASH ON ARRIVAL (COD)</span>
                  <span className="text-[9px] font-bold tracking-widest border border-current px-1.5 py-0.5 rounded-sm">COD</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-700 font-bold uppercase tracking-wider pt-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-950 text-white text-xs font-bold uppercase tracking-widest py-4 hover:opacity-90 transition-opacity rounded-xs flex items-center justify-center space-x-2 shadow-sm sound-click"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {loading
                  ? 'Processing Securely...'
                  : paymentMethod === 'cod'
                  ? `CONFIRM COD ORDER — ${formatPrice(getCartTotal())}`
                  : `PROCEED TO ACQUISITION — ${formatPrice(getCartTotal())}`}
              </span>
            </button>
          </form>
        </div>

        {/* Right column: Order Summary Panel */}
        <div className="lg:col-span-5 bg-white border border-stone-200/50 p-6 rounded-xs shadow-xs h-fit space-y-6">
          <div className="border-b border-stone-100 pb-3 flex items-center space-x-2">
            <ShoppingBag className="h-4.5 w-4.5 text-stone-800" />
            <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider">
              Order Summary
            </h3>
          </div>

          {/* Items Preview */}
          <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto space-y-3 pr-2">
            {cart.map((item) => {
              const activePrice = item.discountPrice !== undefined && item.discountPrice > 0 
                ? item.discountPrice 
                : item.price;
              return (
                <div key={item.id} className="flex items-center space-x-3 pt-3 first:pt-0">
                  <div className="relative h-14 w-11 bg-stone-100 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow text-[11px] text-stone-600">
                    <p className="font-semibold text-stone-900 uppercase tracking-wide line-clamp-1">{item.name}</p>
                    <p className="uppercase tracking-widest text-[9px] mt-0.5 text-stone-400">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-stone-900">
                    {formatPrice(activePrice * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-stone-100 pt-4 space-y-2 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">{formatPrice(getCartSubtotal())}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-emerald-700">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Discount ({coupon.discountPercent}%)</span>
                </span>
                <span>-{formatPrice(getDiscountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between pb-2">
              <span>Shipping</span>
              <span>
                {getShippingFee() === 0 ? 'FREE' : formatPrice(getShippingFee())}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-stone-150">
              <span className="font-syne font-bold uppercase text-stone-900 text-sm">Total Amount</span>
              <span className="font-syne font-extrabold text-stone-950 text-lg">
                {formatPrice(getCartTotal())}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Mock Payment Simulator Modal */}
      <AnimatePresence>
        {showSimulator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0c0b] text-white border border-amber-500/20 rounded-xs shadow-2xl p-6 relative space-y-6 overflow-hidden"
            >
              {/* Gold foiled decorative border */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />
              
              <div className="flex justify-between items-center pb-3 border-b border-stone-850">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-amber-400" />
                  <span className="font-syne font-bold uppercase tracking-wider text-xs">
                    ARVIIK PAYMENT GATEWAY
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimulator(false)}
                  className="text-stone-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Amount Display */}
              <div className="text-center bg-stone-900/50 p-4 border border-stone-850 rounded-xs space-y-1">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Amount to Pay</p>
                <p className="text-2xl font-syne font-extrabold text-white">{formatPrice(getCartTotal())}</p>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 border-b border-stone-900 pb-3">
                <button
                  type="button"
                  onClick={() => setSimulatorTab('upi')}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    simulatorTab === 'upi' ? 'border-amber-400 text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-300'
                  }`}
                >
                  UPI TRANSFER
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatorTab('card')}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    simulatorTab === 'card' ? 'border-amber-400 text-amber-400' : 'border-transparent text-stone-500 hover:text-stone-300'
                  }`}
                >
                  CARD METHOD
                </button>
              </div>

              {/* Tab Contents */}
              {simulatorTab === 'upi' ? (
                <div className="space-y-5 text-center flex flex-col items-center justify-center">
                  <p className="text-[10px] text-stone-400 tracking-wide leading-relaxed">
                    Scan dynamic QR Code using any UPI app (GPay, PhonePe, Paytm) to initiate test transfer.
                  </p>
                  <div className="bg-white p-3 rounded-xs border border-amber-500/20 shadow-inner">
                    <QrCode className="h-32 w-32 text-stone-950" />
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono tracking-widest">
                    VPA: arviik.atelier@upi
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulatedPayment}
                    disabled={loading}
                    className="w-full bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-widest py-3.5 hover:bg-amber-400 transition-colors rounded-xs shadow-md"
                  >
                    {loading ? 'Verifying Transfer...' : 'Simulate UPI Payment Success'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] text-stone-400 tracking-wide text-center">
                    Enter any test card details to process transaction safely.
                  </p>
                  <div className="space-y-3 font-sans text-stone-300 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-stone-550 font-bold uppercase tracking-wider">Cardholder Name</label>
                      <input
                        type="text"
                        disabled
                        value={name}
                        className="w-full bg-stone-900 border border-stone-800 px-3 py-2 text-xs text-stone-350 focus:outline-none rounded-xs select-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-stone-550 font-bold uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        disabled
                        value="4312 •••• •••• 9876"
                        className="w-full bg-stone-900 border border-stone-800 px-3 py-2 text-xs text-stone-350 focus:outline-none rounded-xs select-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-stone-550 font-bold uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          disabled
                          value="12/29"
                          className="w-full bg-stone-900 border border-stone-800 px-3 py-2 text-xs text-stone-350 focus:outline-none rounded-xs text-center select-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-stone-550 font-bold uppercase tracking-wider">CVV Code</label>
                        <input
                          type="password"
                          disabled
                          value="•••"
                          className="w-full bg-stone-900 border border-stone-800 px-3 py-2 text-xs text-stone-350 focus:outline-none rounded-xs text-center select-none"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulatedPayment}
                    disabled={loading}
                    className="w-full bg-amber-500 text-stone-950 text-xs font-bold uppercase tracking-widest py-3.5 hover:bg-amber-400 transition-colors rounded-xs shadow-md mt-2"
                  >
                    {loading ? 'Authorising...' : 'Authorise Test Transaction'}
                  </button>
                </div>
              )}

              {/* Secure Footer */}
              <div className="text-center text-[9px] text-stone-550 uppercase tracking-widest font-medium border-t border-stone-850 pt-3 flex items-center justify-center space-x-1">
                <span>🔐 Sandbox Secured Encryption 256-Bit</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
