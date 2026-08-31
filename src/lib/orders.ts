import { supabase } from '@/lib/supabase';

// Mirrors the `orders.status` CHECK constraint in
// supabase/migrations/0004_orders.sql — keep in sync with the database.
export type OrderStatus = 'pending' | 'accepted' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  size: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    slug: string;
    discount_price: number | null;
    price: number;
    product_images: { image_url: string }[];
  } | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_amount: number;
  shipping_fee: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
  order_items: OrderItem[];
  payments: { status: string; provider: string; amount: number }[];
}

const ORDER_SELECT = `
  id, user_id, status, total_amount, shipping_fee,
  shipping_name, shipping_email, shipping_phone,
  shipping_address, shipping_city, shipping_state, shipping_pincode,
  created_at,
  order_items (
    id, order_id, product_id, size, quantity, price,
    products ( name, slug, price, discount_price, product_images ( image_url ) )
  ),
  payments ( status, provider, amount )
`;

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as any;
}

// Human-facing label for each DB status — keep aligned with the step
// vocabulary already used on /track-order for a consistent experience.
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  accepted: 'Confirmed',
  packing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

// A customer can only cancel while the order is still awaiting admin
// acceptance. Once the admin accepts it (or it moves further along),
// cancellation is no longer offered — only 'pending' qualifies.
export function isCancellable(status: OrderStatus) {
  return status === 'pending';
}

// Return/exchange only makes sense once the customer has actually received it.
export function isReturnable(status: OrderStatus) {
  return status === 'delivered';
}

export function orderDisplayId(id: string) {
  return `ARV-${id.slice(0, 8).toUpperCase()}`;
}
