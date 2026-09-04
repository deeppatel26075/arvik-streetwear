import LegalPageLayout, { LegalSection } from '@/components/LegalPageLayout';

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <p>
        This policy explains what information ARVIIK collects when you browse or buy from arviik.in, how we
        use it, who we share it with, and the choices you have. We collect only what&apos;s needed to run the
        store, ship your order, and (if you opt in) tell you about new drops.
      </p>
    ),
  },
  {
    id: 'collect',
    title: 'Information We Collect',
    body: (
      <>
        <p><strong>Information you give us directly</strong> when you create an account, checkout, or contact us:</p>
        <ul>
          <li>Name, email address, and phone number</li>
          <li>Shipping address, city, state, and pincode</li>
          <li>Order history and items in your cart or wishlist</li>
          <li>Messages you send through the Contact page or support email</li>
        </ul>
        <p className="pt-1"><strong>Information collected automatically</strong> as you browse:</p>
        <ul>
          <li>Device and browser type, IP address, and approximate location</li>
          <li>Pages viewed, products browsed, and time spent on the site</li>
          <li>Cookies and local storage used to keep you signed in, remember your cart, and measure site performance</li>
        </ul>
        <p className="pt-1">
          <strong>Payment information</strong> is collected and processed directly by Razorpay, our payment
          gateway — we never see or store your full card number, CVV, or UPI PIN. See our{' '}
          <a href="/payment-policy">Payment Policy</a>{' '}for details.
        </p>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How We Use Your Information',
    body: (
      <ul>
        <li>To process, pack, ship, and deliver your orders, and to keep you updated on their status</li>
        <li>To verify deliverability of your address before an order is placed</li>
        <li>To respond to support requests and resolve issues with an order</li>
        <li>To send order confirmations, shipping updates, and (only if you&apos;ve opted in) marketing emails about new drops and offers</li>
        <li>To detect and prevent fraud, abuse, or security incidents</li>
        <li>To improve the site — what people browse, where they drop off, what doesn&apos;t work</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: 'Who We Share It With',
    body: (
      <>
        <p>
          We don&apos;t sell your personal data. We share it only with the vendors that make the store actually
          work, each bound to use it only for that purpose:
        </p>
        <ul>
          <li><strong>Razorpay</strong> — to process payments securely.</li>
          <li><strong>NimbusPost</strong> and our courier partners — to check deliverability and ship your order.</li>
          <li><strong>Supabase</strong> — our database and authentication provider, which stores your account and order data.</li>
          <li>Law enforcement or regulators, only when legally required to do so.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies & Local Storage',
    body: (
      <p>
        We use cookies and browser local storage to keep you signed in, remember what&apos;s in your cart and
        wishlist between visits, and understand how the site is used so we can improve it. You can block or
        clear cookies in your browser settings, though some site features (like a persistent cart) may stop
        working properly if you do.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'How We Protect Your Data',
    body: (
      <p>
        Your data is stored with industry-standard encryption at rest and in transit, and access is
        restricted to systems and staff that need it to run the store. No online system is 100% secure, but
        we take reasonable, current measures to protect your information from unauthorised access, loss, or
        misuse.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your Rights',
    body: (
      <>
        <p>You can, at any time:</p>
        <ul>
          <li>Access or update your account details from your Profile page.</li>
          <li>Request a copy of the personal data we hold about you.</li>
          <li>Ask us to delete your account and associated personal data, subject to what we&apos;re legally required to retain (e.g. order records for tax purposes).</li>
          <li>Unsubscribe from marketing emails at any time using the link in any such email.</li>
        </ul>
        <p className="pt-1">
          To exercise any of these, email <a href="mailto:support@arviik.com">support@arviik.com</a>{' '}from the
          email address on your account.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Data Retention',
    body: (
      <p>
        We keep your account and order data for as long as your account is active, and for a reasonable
        period after to meet our tax, accounting, and legal obligations. If you delete your account, we
        remove personal data we&apos;re not legally required to retain.
      </p>
    ),
  },
  {
    id: 'children',
    title: "Children's Privacy",
    body: (
      <p>
        ARVIIK isn&apos;t directed at children under 18, and we don&apos;t knowingly collect personal information
        from anyone under that age. If you believe a minor has provided us with personal data, contact us and
        we&apos;ll remove it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy as our practices evolve or as required by law. The &quot;Last
        updated&quot; date at the top always reflects the current version — check back occasionally if you want
        to stay current.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: (
      <p>
        Questions about your data or this policy? Reach us at{' '}
        <a href="mailto:support@arviik.com">support@arviik.com</a> or through our{' '}
        <a href="/contact">Contact page</a>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Your Data, Handled Right"
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the choices you have — in plain language, not legalese."
      lastUpdated="September 5, 2026"
      sections={SECTIONS}
    />
  );
}
