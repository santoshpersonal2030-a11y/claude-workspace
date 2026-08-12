import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { SITE, whatsappLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact Us · Online Pooja Stores',
  description:
    'Get in touch with Online Pooja Stores — email, phone, or WhatsApp for orders and support.',
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact us"
      subtitle="We’re happy to help with orders, products or delivery."
    >
      <div className="rounded-xl border border-gold/40 bg-white p-5">
        <p className="text-burgundy-dark">
          <strong>Email:</strong>{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
        <p className="mt-2 text-burgundy-dark">
          <strong>Phone / WhatsApp:</strong> {SITE.phone}
        </p>
        <p className="mt-2 text-burgundy-dark">
          <strong>Support hours:</strong> {SITE.supportHours}
        </p>
        <p className="mt-2 text-burgundy-dark">
          <strong>Address:</strong>
          <br />
          {SITE.addressLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </p>

        <a
          href={whatsappLink('Hello! I have a question about Online Pooja Stores.')}
          className="mt-4 inline-block rounded-lg bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream !no-underline hover:bg-burgundy-dark"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat on WhatsApp
        </a>
      </div>

      <p className="text-sm text-burgundy-dark/60">
        For order-related queries, please keep your order number (e.g.
        ORD-2026-001) handy.
      </p>
    </PageShell>
  );
}
