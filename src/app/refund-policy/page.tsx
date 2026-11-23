import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Exchange Policy | ARVIIK',
  description:
    'ARVIIK offers size exchanges, not refunds. How exchanges, cancellations and damaged or wrong items are handled.',
};

// Served at /refund-policy (kept so existing links keep working).
// Policy in short: exchanges only, no refunds — except a full refund when a
// prepaid order is cancelled within 2 hours of confirmation, before it ships.

const SECTIONS: LegalSection[] = [
  {
    id: 'no-refunds',
    title: 'No Refunds, Exchanges Only',
    body: (
      <>
        <p>
          ARVIIK does <strong>not offer refunds</strong> on delivered orders. Instead, eligible products can be{' '}
          <strong>exchanged</strong> under the terms below.
        </p>
        <p>
          The only time money is returned is when a prepaid order is cancelled within the 2-hour cancellation
          window, explained under <a href="#cancellations">Order Cancellations</a>.
        </p>
      </>
    ),
  },
  {
    id: 'window',
    title: 'Exchange Window',
    body: (
      <p>
        You can request an exchange within <strong>7 days of delivery</strong>. To be eligible, the item must be
        unworn, unwashed, undamaged, and have its original tags and packaging still attached, exactly how it
        arrived. Requests made outside this window, or for items that don&apos;t meet these conditions, won&apos;t
        be accepted.
      </p>
    ),
  },
  {
    id: 'what-can-be-exchanged',
    title: 'What Can Be Exchanged',
    body: (
      <>
        <p>
          Exchanges are for a <strong>different size of the same design</strong>, subject to stock availability
          in the size you want. Since our fits run oversized, check the Size Guide on the product page before
          ordering. It&apos;ll save you a round trip.
        </p>
        <p>The following can&apos;t be exchanged:</p>
        <ul>
          <li>Items marked &quot;Final Sale&quot; or purchased during a clearance/liquidation drop.</li>
          <li>Items showing signs of wear, washing, odour, or alteration.</li>
          <li>Items missing their original tags or packaging.</li>
          <li>Gift cards.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-to-exchange',
    title: 'How to Request an Exchange',
    body: (
      <>
        <p>
          Contact us at <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}or through our{' '}
          <a href="/contact">Contact page</a>{' '}with your order number and the size you&apos;d like instead.
        </p>
        <p>
          Once your request is approved, the item will be collected from your delivery address. You
          don&apos;t need to visit a courier office yourself.
        </p>
        <p>
          The item then goes through a quality check at our warehouse. Once it passes, your replacement is
          processed and delivered within <strong>7–10 working days</strong>, subject to availability and your
          delivery location.
        </p>
      </>
    ),
  },
  {
    id: 'shipping-fee',
    title: 'Shipping Fees on Exchanges',
    body: (
      <p>
        Pickup of an approved exchange is free. The shipping fee and any Cash on Delivery handling fee paid on
        the original order are not returned, since they cover the original delivery.
      </p>
    ),
  },
  {
    id: 'damaged',
    title: 'Damaged, Defective, or Wrong Item',
    body: (
      <>
        <p>
          If your order arrives damaged, defective, or isn&apos;t what you ordered, contact us within{' '}
          <strong>48 hours of delivery</strong> at <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}with your
          order number and a photo of the issue.
        </p>
        <p>
          We&apos;ll send a <strong>free replacement</strong>. If the same item is out of stock, you can exchange it
          for another product of equal value instead. This doesn&apos;t count against the standard 7-day
          exchange window.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Order Cancellations',
    body: (
      <>
        <p>
          You can cancel an order within <strong>2 hours of order confirmation</strong>, before it&apos;s packed,
          by contacting <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}with your order number.
        </p>
        <ul>
          <li>
            <strong>Prepaid orders</strong> cancelled within this window are refunded in full to the original
            payment method.
          </li>
          <li>
            <strong>Cash on Delivery orders</strong> cancelled within this window are simply cancelled; nothing
            has been charged.
          </li>
        </ul>
        <p>After 2 hours, an order can&apos;t be cancelled or refunded. Once delivered, eligible items can be exchanged as described above.</p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Need Help With an Exchange?',
    body: (
      <p>
        Email <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}with your order number, or reach us through
        our <a href="/contact">Contact page</a>. We&apos;re usually quick to respond.
      </p>
    ),
  },
];

export default function ExchangePolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Exchanges & Cancellations"
      title="Exchange Policy"
      intro="We don't offer refunds. Here's exactly how size exchanges, cancellations and damaged items work."
      lastUpdated="November 24, 2026"
      sections={SECTIONS}
    />
  );
}
