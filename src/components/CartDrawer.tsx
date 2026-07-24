'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { X, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    cart,
    coupon,
    couponError,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    getCartSubtotal,
    getDiscountAmount,
    getShippingFee,
    getCartTotal,
  } = useCart();

  useEffect(() => {
    const handleOpenCart = () => setIsOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, []);

  useEffect(() => {
    if (couponError) {
      setCouponMsg({ type: 'error', text: couponError });
    }
  }, [couponError]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setLoadingCoupon(true);
    setCouponMsg(null);
    const success = await applyCoupon(couponCode);
    setLoadingCoupon(false);

    if (success) {
      setCouponMsg({ type: 'success', text: 'Coupon applied successfully!' });
      setCouponCode('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMsg(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-50"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#ECECEC] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECECEC]">
              <div className="flex items-center space-x-2">
                <span className="font-bold uppercase tracking-wider text-[#111111] text-xs">
                  Shopping Bag
                </span>
                <span className="bg-[#F7F7F7] text-[#111111] border border-[#ECECEC] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#666666] hover:text-[#111111] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            {cart.length > 0 && (() => {
              const subtotal = getCartSubtotal();
              const freeShippingThreshold = 1499;
              const remaining = freeShippingThreshold - subtotal;
              const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

              return (
                <div className="bg-stone-50 border-b border-stone-200 px-6 py-2.5 space-y-1 text-[10px] font-extrabold uppercase tracking-wider">
                  <div className="flex justify-between items-center text-stone-900">
                    <span>
                      {remaining <= 0 ? (
                        <span className="text-emerald-700 font-bold">⚡ FREE EXPRESS SHIPPING UNLOCKED!</span>
                      ) : (
                        <span>Add <span className="text-stone-950 font-mono font-bold">{formatPrice(remaining)}</span> more for FREE Shipping!</span>
                      )}
                    </span>
                    <span className="text-stone-500 font-mono">{progress}%</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-stone-950 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12">
                  <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">
                    Your bag is empty
                  </p>
                  <Link
                    href="/shop"
                    onClick={() => setIsOpen(false)}
                    className="apple-button text-xs tracking-widest"
                  >
                    Shop Collection
                  </Link>
                </div>
              ) : (
                cart.map((item) => {
                  const activePrice =
                    item.discountPrice !== undefined && item.discountPrice > 0
                      ? item.discountPrice
                      : item.price;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start space-x-4 pb-4 border-b border-[#ECECEC] bg-white p-3 rounded-[18px] border border-[#ECECEC] shadow-xs"
                    >
                      {/* Product Image */}
                      <div className="relative h-20 w-16 bg-[#F7F7F7] flex-shrink-0 rounded-[10px] overflow-hidden">
                        <Image
                          src={item.image || '/placeholder-tee.jpg'}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      {/* Detail Info */}
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between">
                          <Link
                            href={`/shop/${item.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="font-bold text-xs tracking-wider uppercase text-[#111111] hover:text-[#666666] line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <span className="text-xs font-bold text-[#111111]">
                            {formatPrice(activePrice * item.quantity)}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#666666] uppercase tracking-widest font-bold">
                          Size: {item.size}
                        </p>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center border border-[#ECECEC] rounded-[8px] bg-[#F7F7F7] text-xs">
                            <button
                              onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                              className="px-2.5 py-1 text-[#666666] hover:text-[#111111] font-bold"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-bold px-2 text-[#111111]">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                              className="px-2.5 py-1 text-[#666666] hover:text-[#111111] font-bold"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.productId, item.size)}
                            className="text-[#666666] hover:text-[#DC2626] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Calculator / Summary */}
            {cart.length > 0 && (
              <div className="bg-white border-t border-[#ECECEC] px-6 py-4 space-y-3">
                {/* Coupon area */}
                <div className="space-y-1.5">
                  {coupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xs">
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <Tag className="h-4 w-4" />
                        <span>Code: {coupon.code} ({coupon.discountPercent}% OFF)</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-red-700 hover:text-red-900 font-extrabold uppercase tracking-wider underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="COUPON CODE"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="apple-input flex-grow text-[10px] uppercase font-bold py-2 px-3"
                        />
                        <button
                          type="submit"
                          disabled={loadingCoupon}
                          className="bg-stone-950 text-white text-[10px] font-extrabold uppercase px-4 hover:bg-stone-900 rounded-xs transition-colors"
                        >
                          Apply
                        </button>
                      </form>

                      {/* Quick 1-Tap Coupon Chips */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-wider">Tap Code:</span>
                        {['WELCOME10', 'B31199', 'ARVIIK20'].map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => {
                              setCouponCode(code);
                              applyCoupon(code);
                            }}
                            className="text-[8px] font-extrabold text-stone-800 bg-stone-100 hover:bg-stone-950 hover:text-white px-2 py-0.5 rounded-xs border border-stone-200 uppercase transition-colors"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {couponMsg && (
                    <p
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        couponMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {couponMsg.text}
                    </p>
                  )}
                </div>

                {/* Subtotals list */}
                <div className="space-y-1.5 text-xs text-[#666666] border-b border-[#ECECEC] pb-3 font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#111111]">{formatPrice(getCartSubtotal())}</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-[#16A34A]">
                      <span>Discount ({coupon.discountPercent}%)</span>
                      <span>-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {getShippingFee() === 0 ? 'FREE' : formatPrice(getShippingFee())}
                    </span>
                  </div>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold uppercase text-[#111111] text-xs tracking-widest">Total</span>
                  <span className="font-bold text-[#111111] text-lg">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>

                {/* Checkout CTA */}
                <div className="space-y-2 pt-1">
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-stone-950 hover:bg-stone-900 text-white font-extrabold text-xs tracking-widest uppercase py-4 rounded-xs shadow-md transition-all flex items-center justify-center space-x-2 border border-transparent hover:border-stone-800"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <span className="text-stone-300">→</span>
                  </Link>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest text-center flex items-center justify-center gap-1">
                    <span>🔒 256-Bit Encrypted Secure Checkout</span>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
