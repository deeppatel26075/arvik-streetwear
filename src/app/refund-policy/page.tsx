import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';

const SECTIONS: LegalSection[] = [
  {
    id: 'window',
    title: 'Return Window',
    body: (
      <p>
        You can request a return within <strong>7 days of delivery</strong>. To be eligible, the item must be
        unworn, unwashed, undamaged, and have its original tags still attached — exactly how it arrived.
        Items returned outside this window, or that don&apos;t meet these conditions, won&apos;t be accepted.
      </p>
    ),
  },
  {
    id: 'non-returnable',
    title: "What Can't Be Returned",
    body: (
      <ul>
        <li>Items marked &quot;Final Sale&quot; or purchased during a clearance/liquidation drop.</li>
        <li>Items showing signs of wear, washing, odour, or alteration.</li>
        <li>Items missing their original tags or packaging.</li>
        <li>Gift cards.</li>
      </ul>
    ),
  },
  {
    id: 'how-to-return',
    title: 'How to Start a Return',
    body: (
      <>
        <p>
          Go to <strong>Track Order</strong> or <strong>Profile → Orders</strong>, select the item, and choose
          <strong> Return</strong>. A reverse pickup will be scheduled from your delivery address at no extra
          cost — no need to visit a courier office yourself.
        </p>
        <p>Once picked up, your return goes through quality check at our warehouse. If everything checks out, your refund or exchange is processed as below.</p>
      </>
    ),
  },
  {
    id: 'exchanges',
    title: 'Size Exchanges',
    body: (
      <>
        <p>
          Size exchanges are <strong>free</strong>{' '}within the same 7-day window, subject to stock availability
          in the size you want. Since our fits run oversized, check the Size Guide on the product page before
          ordering — it&apos;ll save you a round trip.
        </p>
        <p>
          Exchanges are currently limited to a different size of the <strong>same design</strong>. If you want a
          different design entirely, return the original item for a refund and place a new order.
        </p>
      </>
    ),
  },
  {
    id: 'refund-timeline',
    title: 'Refunds & Exchange Shipping',
    body: (
      <>
        <p>We do not offer refunds after the 2-hour cancellation period.</p>
        <p>
          Orders can be cancelled within 2 hours of order confirmation by contacting{' '}
          <a href="mailto:support@arviik.com">support@arviik.com</a> with your order number.
        </p>
        <p>
          After the 2-hour cancellation period, the order cannot be cancelled or refunded. Eligible products
          can only be exchanged according to our <a href="/terms#orders">Exchange Policy</a>.
        </p>
        <p>
          For an approved exchange, the applicable exchange/return shipping process will be communicated by
          our support team.
        </p>
      </>
    ),
  },
  {
    id: 'shipping-fee',
    title: 'Shipping Fees on Returns',
    body: (
      <p>
        The flat shipping fee charged at checkout (and the COD handling fee, where applicable) is
        non-refundable, since it covers the cost of the original delivery attempt regardless of what happens
        afterward. Reverse pickup for an eligible return is free — you won&apos;t be charged again for it.
      </p>
    ),
  },
  {
    id: 'damaged',
    title: 'Damaged, Defective, or Wrong Item',
    body: (
      <p>
        If your order arrives damaged, defective, or isn&apos;t what you ordered, contact us within{' '}
        <strong>48 hours of delivery</strong> at <a href="mailto:support@arviik.com">support@arviik.com</a>{' '}with
        your order number and a photo of the issue. We&apos;ll arrange a free replacement or full refund — this
        doesn&apos;t count against the standard 7-day window.
      </p>
    ),
  },
  {
    id: 'cancellations',
    title: 'Order Cancellations',
    body: (
      <p>
        Orders can be cancelled free of charge within 2 hours of placing them, before they&apos;re packed —
        contact us immediately with your order number. Once an order has shipped, it can&apos;t be cancelled;
        you&apos;re welcome to return it under the policy above once delivered.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Need Help With a Return?',
    body: (
      <p>
        Email <a href="mailto:support@arviik.com">support@arviik.com</a>{' '}with your order number, or reach us
        through our <a href="/contact">Contact page</a>{' '}— we&apos;re usually quick to respond.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Returns, Exchanges & Refunds"
      title="Refund Policy"
      intro="Straightforward returns, free size exchanges, and refunds that don't take forever."
      lastUpdated="September 5, 2026"
      sections={SECTIONS}
    />
  );
}
