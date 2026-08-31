import Link from 'next/link';
import Image from 'next/image';
import { Order, orderDisplayId } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderCard({ order }: { order: Order }) {
  const firstItem = order.order_items[0];
  const image = firstItem?.products?.product_images?.[0]?.image_url;
  const itemCount = order.order_items.reduce((sum, i) => sum + i.quantity, 0);
  const extraCount = order.order_items.length - 1;

  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="border border-stone-200 rounded-lg p-4 sm:p-5 space-y-4 hover:border-stone-300 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
            {orderDisplayId(order.id)}
          </p>
          <p className="text-[11px] text-stone-500 font-medium">{orderDate}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex gap-4">
        <div className="relative w-20 h-24 flex-shrink-0 bg-stone-100 rounded-sm overflow-hidden border border-stone-200/60">
          {image ? (
            <Image src={image} alt={firstItem?.products?.name || 'Product'} fill sizes="80px" className="object-cover" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0 space-y-1 py-0.5">
          <p className="text-sm font-bold text-stone-950 truncate">
            {firstItem?.products?.name || 'Product'}
            {extraCount > 0 && <span className="text-stone-400 font-medium"> +{extraCount} more</span>}
          </p>
          <p className="text-[11px] text-stone-500 font-semibold uppercase tracking-wide">Qty: {itemCount}</p>
          <p className="text-sm font-extrabold text-stone-950">{formatPrice(order.total_amount)}</p>
        </div>
      </div>

      <div className="flex gap-2.5 pt-1">
        <Link
          href={`/account/orders/${order.id}`}
          className="flex-1 text-center py-3 text-[11px] font-bold uppercase tracking-wider border border-stone-950 text-stone-950 rounded-xs hover:bg-stone-950 hover:text-white transition-all duration-200 active:scale-[0.97]"
        >
          View Details
        </Link>
        {(order.status === 'shipped' || order.status === 'packing' || order.status === 'accepted') && (
          <Link
            href={`/account/orders/${order.id}`}
            className="flex-1 text-center py-3 text-[11px] font-bold uppercase tracking-wider bg-stone-950 text-white rounded-xs hover:bg-stone-800 transition-all duration-200 active:scale-[0.97]"
          >
            Track Order
          </Link>
        )}
      </div>
    </div>
  );
}
