'use client';

import { useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  variant?: 'success' | 'error';
  onDismiss: () => void;
}

// Self-contained toast — each page owns a `message` string in state and
// clears it (directly or via onDismiss) to hide this. No global provider,
// no new dependency, mirrors the fixed-overlay pattern already used for
// the account dropdown/search suggestions in Navbar.tsx.
export default function Toast({ message, variant = 'success', onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  const isError = variant === 'error';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in px-4 w-full max-w-sm">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold ${
          isError
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-stone-950 border-stone-800 text-white'
        }`}
      >
        {isError ? <AlertCircle className="h-4 w-4 flex-shrink-0" /> : <Check className="h-4 w-4 flex-shrink-0 text-lime-400" />}
        <span>{message}</span>
      </div>
    </div>
  );
}
