import { Check, Clock, Truck, PackageSearch, XCircle, RotateCcw } from 'lucide-react';
import { OrderStatus, STATUS_LABELS } from '@/lib/orders';

// Status is never conveyed by color alone — every badge pairs an icon with
// the text label so it still reads correctly for colorblind users or with
// color rendering disabled.
const STATUS_STYLE: Record<OrderStatus, { classes: string; icon: typeof Check }> = {
  pending: { classes: 'bg-stone-100 text-stone-700 border-stone-200', icon: Clock },
  accepted: { classes: 'bg-stone-100 text-stone-700 border-stone-200', icon: Check },
  packing: { classes: 'bg-amber-50 text-amber-800 border-amber-200', icon: PackageSearch },
  shipped: { classes: 'bg-blue-50 text-blue-800 border-blue-200', icon: Truck },
  delivered: { classes: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Check },
  cancelled: { classes: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  returned: { classes: 'bg-stone-100 text-stone-700 border-stone-200', icon: RotateCcw },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { classes, icon: Icon } = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {STATUS_LABELS[status]}
    </span>
  );
}
