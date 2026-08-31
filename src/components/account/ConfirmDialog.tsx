'use client';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={onCancel} />
      <div className="animate-fade-in relative w-full max-w-sm bg-white rounded-lg border border-stone-200 shadow-2xl p-6 space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-syne font-extrabold text-base uppercase tracking-wide text-stone-950">{title}</h3>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-stone-700 border border-stone-200 rounded-xs hover:bg-stone-50 transition-all duration-200 active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-white rounded-xs transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-950 hover:bg-stone-900'
            }`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
