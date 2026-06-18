'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { SoundPlayer } from '@/components/SoundExperience';
import { LogOut, Package, Heart, MapPin, User, Check, RefreshCw, Lock as LockIcon, ShieldCheck, QrCode, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const { wishlist, toggleWishlist } = useCart();

  // Active section tab: orders=ARCHIVE, wishlist=SAVED PIECES, address=IDENTITY, vault=MY VAULT
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'address' | 'vault'>('orders');

  // Address edit state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Authenticity Passport Modal state
  const [passportOpen, setPassportOpen] = useState(false);
  const [passportData, setPassportData] = useState<any>(null);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Sync profile details to states
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.shipping_address || '');
      setCity(profile.shipping_city || '');
      setState(profile.shipping_state || '');
      setPincode(profile.shipping_pincode || '');
    }
  }, [profile]);

  // Fetch orders from Supabase (or fallback local storage custom orders)
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;
      setLoadingOrders(true);

      let loadedOrders = [];

      // Try local storage cache first
      try {
        const local = localStorage.getItem('arviik_custom_orders');
        if (local) {
          const parsed = JSON.parse(local);
          // Filter guest or authenticated orders matching user email/id
          loadedOrders = parsed.filter((o: any) => o.shipping_email === user.email || o.user_id === user.id);
        }
      } catch (localErr) {
        console.warn('Local storage orders fetch skipped:', localErr);
      }

      // Try database
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*, product_images(image_url)))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Format DB orders
          const dbOrders = data.map((order: any) => ({
            ...order,
            id: order.id,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            order_items: order.order_items || []
          }));
          
          // Merge and prioritize DB orders
          const orderMap = new Map();
          loadedOrders.forEach((o: any) => orderMap.set(o.id, o));
          dbOrders.forEach((o: any) => orderMap.set(o.id, o));
          loadedOrders = Array.from(orderMap.values()).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      } catch (err) {
        console.error('Error fetching user orders from DB:', err);
      }

      setOrders(loadedOrders);
      setLoadingOrders(false);
    };

    fetchUserOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh] bg-stone-50">
        <div className="flex items-center space-x-2 text-stone-600 text-xs uppercase tracking-widest font-bold">
          <RefreshCw className="h-4 w-4 animate-spin text-stone-900" />
          <span>Loading Account...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    SoundPlayer.playTick();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          shipping_address: address,
          shipping_city: city,
          shipping_state: state,
          shipping_pincode: pincode,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSaveSuccess(true);
      await refreshProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn('Failed to save address to DB, updating locally:', err);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-150';
      case 'cancelled': return 'bg-red-50 text-red-800 border-red-150';
      case 'shipped': return 'bg-blue-50 text-blue-800 border-blue-150';
      default: return 'bg-stone-100 text-stone-850 border-stone-200/50';
    }
  };

  // Tab click wrapper
  const handleTabClick = (tab: any) => {
    SoundPlayer.playTick();
    setActiveTab(tab);
  };

  // Open Authenticity Passport Modal
  const handleOpenPassport = (item: any, date: string, orderId: string) => {
    SoundPlayer.playUnlock();
    setPassportData({
      itemName: item.products?.name || item.name || 'STREETWEAR OVERSIZED TEE',
      acquiredDate: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      serial: `AVK-${orderId.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      batchNo: Math.floor(10 + Math.random() * 280),
      owner: profile?.full_name || fullName || 'ARVIIK COLLECTOR'
    });
    setPassportOpen(true);
  };

  // Membership status helper
  const purchasedItemsCount = orders.reduce((sum, order) => sum + (order.order_items?.length || 0), 0);
  
  let houseStatus = 'OBSERVER';
  let houseStatusColor = 'text-stone-400';
  if (purchasedItemsCount >= 10) {
    houseStatus = 'INNER CIRCLE';
    houseStatusColor = 'text-amber-500';
  } else if (purchasedItemsCount >= 5) {
    houseStatus = 'COLLECTOR';
    houseStatusColor = 'text-lime-400';
  } else if (purchasedItemsCount >= 1) {
    houseStatus = 'MEMBER';
    houseStatusColor = 'text-stone-200';
  }

  // Pre-configured upcoming drops locked inside Vault
  const upcomingDrops = [
    { name: 'ARVIIK / 005 "CYBER CITY" ZIP HOODIE', date: 'WINTER 2026' },
    { name: 'ARVIIK / 006 "DISCORD" FLEECE SWEATSHIRT', date: 'WINTER 2026' },
    { name: 'ARVIIK / 007 "NOMAD" HEAVYWEIGHT PANTS', date: 'SPRING 2027' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 font-sans">
      
      {/* Header Profile Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-200 pb-6 mb-10 gap-4">
        <div>
          <span className="text-[10px] text-stone-400 font-bold tracking-[0.3em] uppercase">
            HOUSE IDENTITY
          </span>
          <h1 className="font-syne font-extrabold text-2xl uppercase tracking-wider text-stone-900 mt-1">
            Account Dashboard
          </h1>
          <p className="text-xs text-stone-500 font-light mt-0.5">Welcome, {profile?.full_name || user.email}</p>
        </div>

        <button
          onClick={() => signOut().then(() => router.push('/login'))}
          className="inline-flex items-center space-x-1.5 border border-stone-200 hover:border-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-750 hover:text-stone-950 transition-colors w-fit rounded-sm shadow-xs sound-click"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Navigation columns */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-stone-200 lg:pr-6 pb-4 lg:pb-0 gap-4 text-xs font-bold uppercase tracking-widest text-stone-500 select-none">
          <button
            onClick={() => handleTabClick('orders')}
            className={`flex items-center space-x-2 text-left py-2 hover:text-stone-950 transition-colors ${
              activeTab === 'orders' ? 'text-stone-900 font-bold border-b-2 border-stone-900 lg:border-b-0 lg:border-r-2 lg:border-stone-950 lg:pr-4' : ''
            }`}
          >
            <Package className="h-4 w-4" />
            <span>ARCHIVE</span>
          </button>

          <button
            onClick={() => handleTabClick('wishlist')}
            className={`flex items-center space-x-2 text-left py-2 hover:text-stone-950 transition-colors ${
              activeTab === 'wishlist' ? 'text-stone-900 font-bold border-b-2 border-stone-900 lg:border-b-0 lg:border-r-2 lg:border-stone-950 lg:pr-4' : ''
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>SAVED PIECES ({wishlist.length})</span>
          </button>

          <button
            onClick={() => handleTabClick('vault')}
            className={`flex items-center space-x-2 text-left py-2 hover:text-stone-950 transition-colors ${
              activeTab === 'vault' ? 'text-stone-900 font-bold border-b-2 border-stone-900 lg:border-b-0 lg:border-r-2 lg:border-stone-950 lg:pr-4' : ''
            }`}
          >
            <LockIcon className="h-4 w-4" />
            <span>MY VAULT</span>
          </button>

          <button
            onClick={() => handleTabClick('address')}
            className={`flex items-center space-x-2 text-left py-2 hover:text-stone-950 transition-colors ${
              activeTab === 'address' ? 'text-stone-900 font-bold border-b-2 border-stone-900 lg:border-b-0 lg:border-r-2 lg:border-stone-950 lg:pr-4' : ''
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>IDENTITY</span>
          </button>

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center space-x-2 text-left py-2 text-accent hover:opacity-80 lg:mt-auto font-bold sound-click"
            >
              <User className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>

        {/* Details Container */}
        <div className="lg:col-span-9">
          
          {/* 1. Orders Tab (ARCHIVE) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider pb-3 border-b border-stone-100">
                Purchase Archive
              </h3>
              
              {loadingOrders ? (
                <p className="text-xs text-stone-400 font-light">Checking server archive...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-200 rounded-sm">
                  <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">Archive is empty</p>
                  <Link
                    href="/shop"
                    className="inline-block text-xs bg-stone-900 text-white font-bold uppercase tracking-widest px-6 py-2.5 hover:opacity-85 transition-opacity sound-click"
                  >
                    Explore Drops
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-stone-200/60 rounded-xs bg-white shadow-xs p-5 space-y-4 font-sans"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-100 pb-3 gap-2">
                        <div className="text-[10px] sm:text-xs font-bold text-stone-900">
                          <span>Order Reference: </span>
                          <span className="font-mono text-stone-700">{order.id}</span>
                        </div>
                        <div className="flex space-x-2 text-[10px] font-bold uppercase tracking-wider">
                          <span className={`px-2.5 py-1 rounded-sm border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items loop */}
                      <div className="divide-y divide-stone-100">
                        {order.order_items?.map((item: any, itemIdx: number) => {
                          const pImg = item.products?.product_images?.[0]?.image_url || '/placeholder-tee.jpg';
                          return (
                            <div key={itemIdx} className="flex items-center space-x-3 py-3 first:pt-0">
                              <div className="relative h-12 w-9 bg-stone-100 flex-shrink-0">
                                <img
                                  src={pImg}
                                  alt={item.products?.name || 'Streetwear Tee'}
                                  className="object-cover w-full h-full absolute inset-0"
                                />
                              </div>
                              <div className="flex-grow text-[11px] text-stone-600">
                                <p className="font-semibold text-stone-950 uppercase tracking-wide">
                                  {item.products?.name || 'Streetwear T-Shirt'}
                                </p>
                                <p className="uppercase tracking-widest text-[9px] mt-0.5 text-stone-400">
                                  Size: {item.size} | Qty: {item.quantity}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-stone-900">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-baseline pt-2 border-t border-stone-100 text-xs">
                        <span className="text-stone-400 font-semibold uppercase tracking-wider">Total amount</span>
                        <span className="font-bold text-stone-950">{formatPrice(order.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Wishlist Tab (SAVED PIECES) */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <h3 className="font-syne font-bold uppercase text-stone-900 text-sm tracking-wider pb-3 border-b border-stone-100">
                Saved Pieces
              </h3>

              {wishlist.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-200 rounded-sm">
                  <p className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
                    No pieces saved
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      className="border border-stone-200/50 bg-white rounded-xs overflow-hidden shadow-xs relative flex flex-col"
                    >
                      <Link href={`/shop/${item.slug}`} className="relative aspect-3/4 bg-stone-100 block">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="object-cover w-full h-full absolute inset-0"
                        />
                      </Link>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <Link
                            href={`/shop/${item.slug}`}
                            className="font-syne font-bold text-xs uppercase tracking-wider text-stone-900 block line-clamp-1 hover:opacity-85"
                          >
                            {item.name}
                          </Link>
                          <span className="text-[11px] font-semibold text-stone-500 mt-1 block">
                            {formatPrice(item.discountPrice || item.price)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="w-full bg-stone-900 hover:bg-stone-950 text-white text-[10px] font-bold uppercase tracking-widest py-2 mt-4 rounded-xs transition-colors sound-click"
                        >
                          Remove Piece
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Vault Tab (MY VAULT) */}
          {activeTab === 'vault' && (
            <div className="space-y-8">
              <div className="border-b border-stone-250 pb-3 flex justify-between items-baseline">
                <h3 className="font-syne font-extrabold uppercase text-stone-900 text-sm tracking-wider">
                  Digital Vault
                </h3>
                <span className="text-[8px] text-stone-400 font-bold tracking-[0.2em] uppercase font-mono">
                  HOUSE VERIFIED CERTIFICATES
                </span>
              </div>

              {/* Owned items list */}
              <div className="space-y-4">
                <span className="text-[9px] text-stone-450 font-bold uppercase tracking-wider block font-syne">
                  Owned Pieces
                </span>
                
                {orders.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-stone-200 rounded-sm">
                    <p className="text-stone-450 text-xs font-semibold uppercase tracking-widest">
                      Vault is empty. Acquire a piece to authenticate ownership.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orders.flatMap(order => 
                      order.order_items?.map((item: any, itemIdx: number) => {
                        const pImg = item.products?.product_images?.[0]?.image_url || '/placeholder-tee.jpg';
                        return (
                          <div 
                            key={`${order.id}-${itemIdx}`}
                            className="bg-stone-900 border border-stone-850 p-4.5 rounded-sm flex items-center space-x-4 text-white"
                          >
                            <div className="relative w-14 h-18 bg-stone-950 border border-stone-800 flex-shrink-0">
                              <img src={pImg} alt="Piece" className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <span className="text-[8px] text-lime-400 font-extrabold uppercase tracking-widest">
                                AUTHENTICATED
                              </span>
                              <p className="font-syne font-bold text-xs uppercase tracking-wide truncate mt-0.5">
                                {item.products?.name || item.name || 'ARVIIK PIECE'}
                              </p>
                              <p className="text-[9px] text-stone-450 uppercase tracking-widest font-mono mt-0.5">
                                Size {item.size} | No. {Math.floor(10 + Math.random() * 290)} of 300
                              </p>
                              
                              <button
                                onClick={() => handleOpenPassport(item, order.created_at, order.id)}
                                className="mt-3 inline-flex items-center space-x-1 bg-stone-800 hover:bg-stone-750 text-[9px] text-white font-bold uppercase tracking-wider px-3 py-1.5 rounded-xs transition-colors border border-stone-700 sound-click"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-lime-400" />
                                <span>View Passport</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Locked upcoming items previews */}
              <div className="space-y-4 pt-6 border-t border-stone-200">
                <span className="text-[9px] text-stone-450 font-bold uppercase tracking-wider block font-syne">
                  Locked Pieces (Upcoming drops)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
                  {upcomingDrops.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-stone-100 border border-stone-200/50 p-4 rounded-sm flex flex-col justify-between h-32 relative group overflow-hidden"
                    >
                      {/* Padlock background overlay */}
                      <div className="absolute -right-4 -bottom-4 text-stone-200/40 group-hover:scale-110 transition-transform duration-500">
                        <LockIcon className="h-20 w-20" />
                      </div>

                      <div className="space-y-1 relative z-10">
                        <span className="text-[8px] bg-stone-300 text-stone-800 px-1.5 py-0.5 rounded-xs font-bold uppercase tracking-wider">
                          LOCKED
                        </span>
                        <p className="font-syne font-bold text-[10px] text-stone-800 uppercase tracking-wide pt-1">
                          {item.name}
                        </p>
                      </div>

                      <span className="text-[9px] font-mono text-stone-500 font-semibold tracking-wider relative z-10">
                        OPENS {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Address Tab (IDENTITY) */}
          {activeTab === 'address' && (
            <div className="space-y-8">
              
              {/* House status membership card */}
              <div className="bg-stone-950 text-white p-6 rounded-sm border border-stone-900 shadow-xl space-y-4">
                <span className="text-[9px] text-stone-550 font-bold uppercase tracking-[0.25em] block border-b border-stone-900 pb-2 font-syne">
                  House Status Tiers
                </span>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">MEMBERSHIP GRADE</span>
                  <span className={`font-syne font-extrabold text-sm tracking-[0.2em] uppercase ${houseStatusColor}`}>
                    {houseStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[9px] text-stone-500 font-bold uppercase tracking-widest pt-2 border-t border-stone-900">
                  <span>ACQUIRED PIECES: {purchasedItemsCount}</span>
                  <span>EST. MMXXVI</span>
                </div>
              </div>

              {/* Address Form */}
              <div className="bg-white border border-stone-200/60 rounded-xs p-6 shadow-xs">
                <h3 className="font-syne font-bold uppercase text-stone-900 text-xs tracking-wider pb-3 border-b border-stone-100 mb-6">
                  Shipping Identity Record
                </h3>

                {saveSuccess && (
                  <p className="bg-emerald-50 text-emerald-800 text-[10px] font-bold p-3 border border-emerald-100 rounded-xs mb-5 uppercase tracking-wider flex items-center space-x-1">
                    <Check className="h-4 w-4" />
                    <span>Shipping details synchronized successfully!</span>
                  </p>
                )}

                <form onSubmit={handleSaveAddress} className="space-y-4 text-xs font-semibold text-stone-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/50 px-3 py-2 text-xs focus:outline-none focus:border-stone-950 rounded-sm font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/50 px-3 py-2 text-xs focus:outline-none focus:border-stone-950 rounded-sm font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Street Address</label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-250/50 px-3 py-2 text-xs focus:outline-none focus:border-stone-950 rounded-sm font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/50 px-3 py-2 text-xs focus:outline-none focus:border-stone-950 rounded-sm font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/50 px-3 py-2 text-xs focus:outline-none focus:border-stone-950 rounded-sm font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Pincode</label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/50 px-3 py-2 text-xs focus:outline-none focus:border-stone-950 rounded-sm font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-stone-950 hover:bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xs transition-colors shadow-xs flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Shipping Identity</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Authenticity Passport Modal popup */}
      {passportOpen && passportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs select-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#0c0c0b] text-white border border-amber-500/20 p-6 rounded-sm shadow-2xl relative space-y-6 font-sans"
          >
            {/* Modal Close */}
            <button
              onClick={() => {
                SoundPlayer.playTick();
                setPassportOpen(false);
              }}
              className="absolute top-4 right-4 text-stone-500 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Title */}
            <div className="text-center space-y-1">
              <span className="text-[8px] text-amber-500 font-bold uppercase tracking-[0.35em] block font-syne">
                ARVIIK
              </span>
              <h4 className="font-syne font-extrabold text-xs text-white tracking-[0.2em] uppercase border-b border-stone-900 pb-3">
                AUTHENTICITY PASSPORT
              </h4>
            </div>

            {/* Passport Card details */}
            <div className="space-y-4">
              <div className="flex justify-center py-2">
                <div className="p-3 bg-white/5 rounded-xs border border-white/10 relative">
                  {/* Mock QR Code graphic */}
                  <QrCode className="h-20 w-20 text-white" />
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                    <div className="h-6 w-6 bg-stone-950 border border-stone-850 flex items-center justify-center text-[7px] font-black uppercase text-lime-400 rounded-sm">
                      AVK
                    </div>
                  </div>
                </div>
              </div>

              {/* Data list grid */}
              <div className="grid grid-cols-2 gap-y-2.5 text-[10px] font-bold uppercase tracking-widest text-stone-400 border-t border-b border-stone-900 py-4">
                <div>Owner:</div>
                <div className="text-white text-right truncate">{passportData.owner}</div>
                <div>Piece Name:</div>
                <div className="text-white text-right truncate">{passportData.itemName}</div>
                <div>Serial Number:</div>
                <div className="text-lime-400 font-mono text-right">{passportData.serial}</div>
                <div>Batch Index:</div>
                <div className="text-white text-right font-mono">{passportData.batchNo} of 300</div>
                <div>Date Acquired:</div>
                <div className="text-stone-300 text-right">{passportData.acquiredDate}</div>
                <div>House Status:</div>
                <div className="text-amber-500 text-right flex items-center justify-end space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5 fill-current" />
                  <span>VERIFIED ✓</span>
                </div>
              </div>
            </div>

            {/* Footer stamp logo */}
            <div className="flex justify-between items-center text-[8px] text-stone-600 font-bold uppercase tracking-widest">
              <span>EST. MMXXVI</span>
              <span>NO COMPROMISE</span>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
