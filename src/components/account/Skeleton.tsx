export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 rounded-xs ${className}`} />;
}

export function OrderCardSkeleton() {
  return (
    <div className="border border-stone-200 rounded-lg p-4 sm:p-5 flex gap-4">
      <Skeleton className="w-20 h-24 flex-shrink-0" />
      <div className="flex-1 space-y-2.5 py-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-28 mt-2" />
      </div>
    </div>
  );
}
