import { Check } from 'lucide-react';
import { OrderStatus } from '@/lib/orders';
import OrderStatusBadge from '@/components/account/OrderStatusBadge';

// Adapted from the 7-value DB status enum to a 5-step happy-path timeline.
// There is no distinct "Out for Delivery" state in the schema today — the
// closest honest equivalent is "packing" (labelled Processing here).
// Shared by /account/orders/[id] and /track-order so both read the same.
export const TIMELINE_STEPS = [
  { key: 'pending', label: 'Ordered' },
  { key: 'accepted', label: 'Confirmed' },
  { key: 'packing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

export default function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'returned') {
    return (
      <div className="p-5 border border-stone-200 rounded-lg bg-stone-50/60">
        <OrderStatusBadge status={status} />
        <p className="text-xs text-stone-500 font-medium mt-2">
          {status === 'cancelled' ? 'This order was cancelled.' : 'This order was returned.'}
        </p>
      </div>
    );
  }

  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start overflow-x-auto py-2">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentStepIdx;
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <div key={step.key} className={`flex items-center ${isLast ? '' : 'flex-1 min-w-[64px]'}`}>
            <div className="flex flex-col items-center gap-2 w-16 sm:w-20 flex-shrink-0">
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done ? 'bg-stone-950 border-stone-950 text-white' : 'bg-white border-stone-200 text-stone-300'
                }`}
              >
                <Check className="h-4 w-4" />
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-center leading-tight ${
                  done ? 'text-stone-900' : 'text-stone-300'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 -mt-5 transition-colors ${i < currentStepIdx ? 'bg-stone-950' : 'bg-stone-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
