'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, MapPin, User, Phone, Building2, Map, Hash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/account/ConfirmDialog';
import Toast from '@/components/account/Toast';
import EmptyState from '@/components/account/EmptyState';

// The schema stores exactly one shipping address per profile (see
// supabase/migrations/0001_initial_schema.sql) — there is no `addresses`
// table for multiple labelled addresses yet. This page manages that single
// default address; supporting several saved addresses would need a new
// table + RLS policies added first.
export default function AddressesPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const hasAddress = !!profile?.shipping_address;

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

  const startEditing = () => setEditing(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);
    setSaving(true);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        phone,
        shipping_address: address,
        shipping_city: city,
        shipping_state: state,
        shipping_pincode: pincode,
      });
      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      setToastMsg('Address saved.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save this address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          shipping_address: null,
          shipping_city: null,
          shipping_state: null,
          shipping_pincode: null,
        })
        .eq('id', user.id);
      if (error) throw error;

      await refreshProfile();
      setShowDeleteConfirm(false);
      setToastMsg('Address removed.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not remove this address.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/account"
        className="lg:hidden inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-600 hover:text-stone-950 uppercase tracking-wider transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Account
      </Link>

      <h2 className="font-syne font-extrabold text-sm uppercase tracking-[0.2em] text-stone-950">
        My Addresses
      </h2>

      {errorMsg && (
        <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xs p-4">{errorMsg}</p>
      )}

      {!editing && !hasAddress && (
        <EmptyState
          icon={MapPin}
          title="No Saved Addresses"
          message="Add an address for a faster checkout."
          ctaLabel="Add Address"
          onCtaClick={startEditing}
        />
      )}

      {!editing && hasAddress && (
        <div className="p-5 border border-stone-200 rounded-lg space-y-3 hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full">
              Default Address
            </span>
          </div>
          <div className="text-xs text-stone-700 font-medium leading-relaxed space-y-0.5">
            <p className="font-bold text-stone-950 text-sm">{profile?.full_name}</p>
            <p>{profile?.shipping_address}</p>
            <p>{profile?.shipping_city}, {profile?.shipping_state} - {profile?.shipping_pincode}</p>
            {profile?.phone && <p className="text-stone-500">{profile.phone}</p>}
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={startEditing}
              className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider border border-stone-950 text-stone-950 rounded-xs hover:bg-stone-950 hover:text-white transition-all duration-200 active:scale-[0.97]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider border border-red-200 text-red-600 rounded-xs hover:bg-red-50 transition-all duration-200 active:scale-[0.97]"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSave} className="space-y-4 p-5 border border-stone-200 rounded-lg">
          <Field label="Full Name" icon={User} value={fullName} onChange={setFullName} placeholder="Your full name" required />
          <Field label="Phone Number" icon={Phone} value={phone} onChange={setPhone} placeholder="9876543210" type="tel" required />
          <Field label="Address Line" icon={MapPin} value={address} onChange={setAddress} placeholder="House no., street, area" required />

          <div className="grid grid-cols-2 gap-3">
            <Field label="City" icon={Building2} value={city} onChange={setCity} placeholder="City" required />
            <Field label="State" icon={Map} value={state} onChange={setState} placeholder="State" required />
          </div>

          <Field label="PIN Code" icon={Hash} value={pincode} onChange={setPincode} placeholder="360001" inputMode="numeric" required />

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-3 text-[11px] font-bold uppercase tracking-wider border border-stone-200 text-stone-700 rounded-xs hover:bg-stone-50 transition-all duration-200 active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-900 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete This Address?"
        message="You'll need to add it again before your next checkout."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  required,
}: {
  label: string;
  icon: typeof User;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: 'numeric' | 'text';
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={type}
          required={required}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
        />
        <Icon className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
      </div>
    </div>
  );
}
