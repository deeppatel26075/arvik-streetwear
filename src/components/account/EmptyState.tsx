import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export default function EmptyState({ icon: Icon, title, message, ctaLabel, ctaHref, onCtaClick }: EmptyStateProps) {
  const ctaClasses =
    'inline-block bg-stone-950 text-white text-[11px] font-bold uppercase tracking-widest px-7 py-3.5 rounded-xs transition-all duration-200 hover:bg-stone-800 active:scale-[0.97]';

  return (
    <div className="flex flex-col items-center text-center py-12 sm:py-14 px-6 border border-dashed border-stone-200 rounded-lg">
      <Icon className="h-8 w-8 text-stone-300" />
      <h3 className="font-syne font-extrabold text-sm uppercase tracking-wider text-stone-900 mt-4">{title}</h3>
      <p className="text-xs text-stone-500 font-medium mt-1.5">{message}</p>
      {ctaHref ? (
        <Link href={ctaHref} className={`${ctaClasses} mt-5`}>
          {ctaLabel}
        </Link>
      ) : (
        <button type="button" onClick={onCtaClick} className={`${ctaClasses} mt-5`}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
