import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'FAQ · Online Pooja Stores',
  description: 'Answers to common questions about ordering, payment and delivery.',
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I place an order?',
    a: 'Add items to your cart, go to checkout, enter your delivery address, and place the order. You can pay by Cash on Delivery, or online where available.',
  },
  {
    q: 'Do I need an account to order?',
    a: 'No — you can check out as a guest. Creating an account lets you track orders and reorder faster.',
  },
  {
    q: 'What are the shipping charges?',
    a: `Free over ₹${SITE.freeShippingOver}. Otherwise ₹49 in Hyderabad/Secunderabad, ₹79 elsewhere in Telangana, and ₹149 for the rest of India.`,
  },
  {
    q: 'How long does delivery take?',
    a: 'Usually 2–4 days within Telangana and 4–7 days across the rest of India after dispatch.',
  },
  {
    q: 'Can I pay cash on delivery?',
    a: 'Yes. Cash on Delivery is available everywhere we ship. Online payment may also be offered at checkout.',
  },
  {
    q: 'How do I track my order?',
    a: 'Sign in and open “Account” to see your order history and current status.',
  },
  {
    q: 'What if an item is damaged?',
    a: 'Contact us within 48 hours of delivery with your order number and a photo, and we’ll arrange a replacement or refund.',
  },
];

export default function FaqPage() {
  return (
    <PageShell title="Frequently asked questions">
      <div className="flex flex-col gap-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="rounded-xl border border-gold/40 bg-white p-4"
          >
            <summary className="cursor-pointer font-semibold text-burgundy-dark">
              {f.q}
            </summary>
            <p className="mt-2 text-burgundy-dark/80">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="text-sm text-burgundy-dark/60">
        Didn’t find your answer? <a href="/contact">Contact us</a>.
      </p>
    </PageShell>
  );
}
