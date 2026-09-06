import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';

const SECTIONS: LegalSection[] = [
  {
    id: 'methods',
    title: 'Accepted Payment Methods',
    body: (
      <>
        <p>We accept two ways to pay at checkout:</p>
        <ul>
          <li>
            <strong>Prepaid, via Razorpay</strong>{' '}— Credit &amp; debit cards, UPI (Google Pay, PhonePe, Paytm,
            and others), net banking, and popular wallets.
          </li>
          <li>
            <strong>Cash on Delivery (COD)</strong> — Pay in cash when your order arrives, on pincodes where
            COD is available. A flat COD handling fee applies (see below).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'prepaid-discount',
    title: 'Prepaid Discount',
    body: (
      <p>
        Orders paid online at checkout via Razorpay automatically get <strong>10% off</strong>{' '}— this discount
        doesn&apos;t apply to Cash on Delivery orders. It&apos;s applied at checkout, no code needed.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Payment Security',
    body: (
      <p>
        All online payments are processed through <strong>Razorpay</strong>, a PCI-DSS compliant payment
        gateway used by thousands of Indian businesses. Your card number, CVV, and UPI PIN are entered
        directly into Razorpay&apos;s secure interface — ARVIIK never sees or stores this information on our
        servers.
      </p>
    ),
  },
  {
    id: 'fees',
    title: 'Shipping & COD Fees',
    body: (
      <>
        <p>Shipping and handling fees are shown clearly at checkout before you pay:</p>
        <ul>
          <li>A flat shipping fee applies to every order, <strong>waived automatically on prepaid orders above ₹1,499</strong>.</li>
          <li>Cash on Delivery orders carry an additional flat COD handling fee, on top of the shipping fee.</li>
        </ul>
        <p className="pt-1">
          COD availability is checked against your delivery pincode in real time — some pincodes may only
          support prepaid orders.
        </p>
      </>
    ),
  },
  {
    id: 'failed',
    title: 'Failed or Pending Payments',
    body: (
      <p>
        If a payment fails or is stuck as &quot;pending&quot; but an amount was debited from your account, it&apos;s
        typically auto-reversed by your bank within 5–7 business days. Your order is only confirmed once
        Razorpay verifies a successful payment — if you were charged but didn&apos;t get an order confirmation,
        contact us at <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}with your payment reference
        and we&apos;ll sort it out.
      </p>
    ),
  },
  {
    id: 'currency',
    title: 'Currency & Taxes',
    body: (
      <p>
        All prices are listed and charged in Indian Rupees (₹), inclusive of applicable GST unless stated
        otherwise. We currently only accept payment in INR and ship within India.
      </p>
    ),
  },
  {
    id: 'refund-link',
    title: 'Refunds',
    body: (
      <p>
        Refunds for returned or cancelled orders are covered in detail in our{' '}
        <a href="/refund-policy">Refund Policy</a> — in short, prepaid refunds go back to your original
        payment method within 5–7 business days of approval, and COD refunds are sent via bank transfer or
        UPI.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Payment Issues?',
    body: (
      <p>
        Email <a href="mailto:info@arviik.in">info@arviik.in</a>{' '}with your order number and payment
        reference, or reach us through our <a href="/contact">Contact page</a>.
      </p>
    ),
  },
];

export default function PaymentPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="How You Pay"
      title="Payment Policy"
      intro="Secure checkout via Razorpay, Cash on Delivery where available, and a 10% discount for paying online."
      lastUpdated="September 5, 2026"
      sections={SECTIONS}
    />
  );
}
