'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Lock, Bell, FileText, ShieldCheck, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/account/ConfirmDialog';
import Toast from '@/components/account/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      setToastMsg('Password updated.');
    } catch (err: any) {
      setPasswordError(err.message || 'Could not update your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push('/');
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

      <h2 className="font-syne font-extrabold text-sm uppercase tracking-[0.2em] text-stone-950">
        Settings
      </h2>

      {/* Login & Security */}
      <section className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
          Login &amp; Security
        </p>

        {!showPasswordForm ? (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="w-full flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:border-stone-400 hover:bg-stone-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3 text-xs font-bold text-stone-900 uppercase tracking-wider">
              <Lock className="h-4 w-4 text-stone-500" />
              <span>Change Password</span>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="p-5 border border-stone-200 rounded-lg space-y-4">
            {passwordError && (
              <p className="text-xs font-semibold text-red-600 border border-red-100 bg-red-50 rounded-xs p-3">{passwordError}</p>
            )}
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-3 text-xs focus:outline-none focus:border-stone-900 rounded-sm"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordError(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-3.5 text-[11px] font-bold uppercase tracking-wider border border-stone-200 text-stone-700 rounded-xs hover:bg-stone-50 transition-all duration-200 active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={changingPassword}
                className="flex-1 py-3.5 text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-900 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Notifications */}
      <section className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
          Notifications
        </p>
        <SettingsLink href="/account/notifications" icon={Bell} label="Notification Preferences" />
      </section>

      {/* Legal */}
      <section className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
          Legal
        </p>
        <SettingsLink href="/privacy-policy" icon={FileText} label="Privacy Policy" />
        <SettingsLink href="/terms" icon={ShieldCheck} label="Terms & Conditions" />
      </section>

      {/* Support */}
      <section className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
          Support
        </p>
        <SettingsLink href="/contact" icon={HelpCircle} label="Help & Support" />
      </section>

      {/* Logout — distinct but not aggressive */}
      <div className="pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wider text-red-600 border border-red-100 rounded-xs hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log Out"
        message="You'll need to sign in again to view your orders and account details."
        confirmLabel="Log Out"
        danger
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
}

function SettingsLink({ href, icon: Icon, label }: { href: string; icon: typeof Lock; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 border border-stone-200 rounded-lg hover:border-stone-400 hover:bg-stone-50/50 transition-colors group"
    >
      <div className="flex items-center gap-3 text-xs font-bold text-stone-900 uppercase tracking-wider">
        <Icon className="h-4 w-4 text-stone-500" />
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
    </Link>
  );
}
