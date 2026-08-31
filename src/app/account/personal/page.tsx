'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, User, Mail, Phone, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/account/Toast';

export default function PersonalInformationPage() {
  const { user, profile, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

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
      });
      if (error) throw error;

      await refreshProfile();
      setEditing(false);
      setToastMsg('Your information has been updated.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save your details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link
        href="/account"
        className="lg:hidden inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-600 hover:text-stone-950 uppercase tracking-wider transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Account
      </Link>

      <div className="space-y-1">
        <h2 className="font-syne font-extrabold text-lg sm:text-xl uppercase tracking-wide text-stone-950">
          Personal Information
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 font-medium">View and update your personal details</p>
      </div>

      {errorMsg && (
        <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xs p-4">{errorMsg}</p>
      )}

      {!editing ? (
        <div className="border border-stone-200 rounded-lg">
          <div className="divide-y divide-stone-100">
            <InfoRow icon={User} label="Full Name" value={profile?.full_name || '—'} />
            <InfoRow icon={Mail} label="Email Address" value={user?.email || '—'} />
            <InfoRow icon={Phone} label="Mobile Number" value={profile?.phone || '—'} />
          </div>

          <div className="p-6 sm:p-8 pt-5 sm:pt-6 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="w-full sm:w-auto py-3.5 px-8 text-[11px] font-bold uppercase tracking-wider border border-stone-950 text-stone-950 rounded-xs hover:bg-stone-950 hover:text-white transition-all duration-200 active:scale-[0.97]"
            >
              Edit Information
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5 p-6 sm:p-8 border border-stone-200 rounded-lg max-w-lg">
          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm transition-colors"
              />
              <User className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-stone-100 border border-stone-200 px-4 py-3 pl-10 text-xs text-stone-400 rounded-sm cursor-not-allowed"
              />
              <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-300" />
            </div>
            <p className="text-[10px] text-stone-400">Contact support to change the email on your account.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 pl-10 text-xs focus:outline-none focus:border-stone-900 rounded-sm transition-colors"
              />
              <Phone className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-3.5 text-[11px] font-bold uppercase tracking-wider border border-stone-200 text-stone-700 rounded-xs hover:bg-stone-50 transition-all duration-200 active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-900 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Subtle premium security note — fills the remaining space with
          something meaningful rather than empty white area. */}
      <div className="bg-stone-950 rounded-lg p-6 sm:p-8 flex items-center gap-5">
        <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-lime-400" />
        </div>
        <div>
          <h3 className="font-syne font-extrabold text-xs sm:text-sm uppercase tracking-wider text-white">
            Your Account Is Secure
          </h3>
          <p className="text-xs text-stone-400 font-medium mt-1 max-w-md">
            Keep your information updated to ensure a smooth experience with ARVIIK.
          </p>
        </div>
      </div>

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 sm:gap-5 px-6 sm:px-8 py-5 sm:py-6">
      <div className="h-10 w-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-stone-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">{label}</p>
        <p className="text-sm sm:text-base font-bold text-stone-950 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
