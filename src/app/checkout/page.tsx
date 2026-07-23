'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Check } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { cart, getCartSubtotal, getDiscountAmount, getShippingFee, getCartTotal, coupon } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.shipping_address || '');
      setCity(profile.shipping_city || '');
      setState(profile.shipping_state || '');
      setPincode(profile.shipping_pincode || '');
    }
  }, [profile, user]);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="font-bold text-xl uppercase tracking-wider text-[#111111]">
          Your Bag is Empty
        </h1>
        <p className="text-[#666666] text-xs font-medium max-w-sm mx-auto uppercase tracking-wider">
          Add items to check out.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="apple-button inline-block text-xs tracking-widest shadow-xs hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address || !city || !state || !pincode) {
      setErrorMsg('Please complete all delivery fields');
      return;
    }
    setErrorMsg(null);

    const shippingDetails = { name, phone, address, apartment, city, state, pincode, email: user?.email || 'customer@arviik.com' };
    localStorage.setItem('arviik_shipping', JSON.stringify(shippingDetails));
    router.push('/checkout/payment');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Return button */}
      <div>
        <Link
          href="/cart"
          className="inline-flex items-center space-x-1.5 text-xs text-[#666666] hover:text-[#111111] uppercase tracking-wider font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to cart</span>
        </Link>
      </div>

      {/* Progress steps mapping the design exactly */}
      <div className="flex items-center justify-center space-x-6 pb-2 border-b border-[#ECECEC]">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#111111]">
          <span className="w-5 h-5 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px]">1</span>
          <span className="uppercase tracking-wider text-[9px]">Shipping</span>
        </div>
        <div className="h-[1px] w-8 bg-[#ECECEC]" />
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#666666]">
          <span className="w-5 h-5 rounded-full bg-[#F7F7F7] border border-[#ECECEC] text-[#666666] flex items-center justify-center text-[10px]">2</span>
          <span className="uppercase tracking-wider text-[9px]">Payment</span>
        </div>
        <div className="h-[1px] w-8 bg-[#ECECEC]" />
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#666666]">
          <span className="w-5 h-5 rounded-full bg-[#F7F7F7] border border-[#ECECEC] text-[#666666] flex items-center justify-center text-[10px]">3</span>
          <span className="uppercase tracking-wider text-[9px]">Review</span>
        </div>
      </div>

      <h1 className="font-bold text-sm uppercase tracking-widest text-[#111111] pt-2">
        SHIPPING DETAILS
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            required
            placeholder="Deep Patel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            Address
          </label>
          <input
            type="text"
            required
            placeholder="ARVIIK HQ, Street 12, Surendranagar"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider font-semibold">
            Apartment, suite, etc. (optional)
          </label>
          <input
            type="text"
            placeholder="Near S.T. Stand"
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
              City
            </label>
            <input
              type="text"
              required
              placeholder="Surendranagar"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="apple-input w-full text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
              State
            </label>
            <input
              type="text"
              required
              placeholder="Gujarat"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="apple-input w-full text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-[#666666] font-bold uppercase tracking-wider">
            PIN Code
          </label>
          <input
            type="text"
            required
            placeholder="363001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="apple-input w-full text-xs"
          />
        </div>

        {errorMsg && (
          <p className="text-[10px] text-[#DC2626] font-bold uppercase tracking-wider">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          className="apple-button w-full text-xs tracking-widest uppercase mt-4 shadow-xs"
        >
          CONTINUE TO PAYMENT
        </button>
      </form>
    </div>
  );
}
