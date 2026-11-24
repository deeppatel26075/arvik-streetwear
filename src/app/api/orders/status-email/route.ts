import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { statusEmailHtml, statusEmailSubject, statusEmailText, type EmailStage } from '@/lib/email/statusEmail';

// Called by the admin Orders page right after an order's stage changes.
// Emails the customer about the new stage. Only a signed-in admin can use
// it, and the stage, recipient and contents all come from the database
// (never from the request), so it can't be used to email arbitrary people.

const STAGES: EmailStage[] = ['accepted', 'packing', 'shipped', 'delivered', 'cancelled'];

export async function POST(request: Request) {
  let orderId = '';
  let accessToken = '';
  try {
    const body = await request.json();
    orderId = String(body?.orderId || '');
    accessToken = String(body?.accessToken || '');
  } catch {
    // handled below
  }
  if (!orderId || !accessToken) return Response.json({ error: 'bad_request' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tquoyphmzpsuiwnchctg.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdW95cGhtenBzdWl3bmNoY3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjY2NTQsImV4cCI6MjA5NzI0MjY1NH0.4jgW1wQ1HiTJ3PSlmwSAqUP-GIV8aDYVok-ffyXt_OY',
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  // Must be a real signed-in admin.
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single();
  if (profile?.role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'id, status, total_amount, shipping_name, shipping_email, order_items ( size, quantity, products ( name, product_images ( image_url ) ) ), payments ( provider )'
    )
    .eq('id', orderId)
    .single();
  if (error || !order) return Response.json({ error: 'not_found' }, { status: 404 });

  const stage = order.status as EmailStage;
  if (!STAGES.includes(stage)) return Response.json({ ok: true, skipped: 'no email for this stage' });
  if (!order.shipping_email) return Response.json({ ok: true, skipped: 'no customer email' });

  type Item = { size: string; quantity: number; products: { name: string; product_images: { image_url: string }[] | null } | null };
  const items = ((order.order_items || []) as unknown as Item[]).map((i) => ({
    name: i.products?.name || 'ARVIIK Tee',
    size: i.size,
    quantity: i.quantity,
    image: i.products?.product_images?.[0]?.image_url,
  }));
  const payments = (order.payments || []) as { provider: string }[];
  const paymentMethod: 'cod' | 'online' = !payments.length || payments.some((p) => p.provider === 'cod') ? 'cod' : 'online';

  const data = {
    orderId: order.id,
    customerName: order.shipping_name || '',
    stage,
    items,
    total: Number(order.total_amount) || 0,
    paymentMethod,
  };

  const sent = await sendEmail({
    to: order.shipping_email,
    subject: statusEmailSubject(data),
    html: statusEmailHtml(data),
    text: statusEmailText(data),
  });
  if (!sent.ok) {
    console.error('Order status email not sent:', sent.reason, sent.detail || '');
    return Response.json({ error: sent.reason }, { status: sent.reason === 'not_configured' ? 503 : 502 });
  }
  return Response.json({ ok: true, stage, to: order.shipping_email });
}
