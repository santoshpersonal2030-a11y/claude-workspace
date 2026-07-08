import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Service · Online Pooja Stores',
  description: 'The terms that apply when you use Online Pooja Stores.',
};

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" subtitle="Last updated: 2026">
      <p>
        By using {SITE.name} and placing an order, you agree to these terms.
      </p>

      <h2>Orders &amp; pricing</h2>
      <p>
        All prices are in Indian Rupees (₹) and include applicable taxes unless
        stated otherwise. We try to keep prices and stock accurate, but if an
        error occurs we may cancel the affected order and refund any amount
        paid.
      </p>

      <h2>Payment</h2>
      <p>
        You can pay by Cash on Delivery or, where available, online. For Cash on
        Delivery, payment is due in full when the order is delivered.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery timelines are estimates and may vary due to location or
        circumstances beyond our control. Please ensure the address and phone
        number provided are correct.
      </p>

      <h2>Returns</h2>
      <p>
        Returns and replacements are handled as described on our{' '}
        <a href="/shipping">Shipping &amp; Returns</a> page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </PageShell>
  );
}
