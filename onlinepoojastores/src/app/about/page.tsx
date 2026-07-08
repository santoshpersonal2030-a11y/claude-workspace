import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About Us · Online Pooja Stores',
  description:
    'Online Pooja Stores brings verified, good-quality pooja essentials to your doorstep across India.',
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Online Pooja Stores"
      subtitle="Pooja essentials, delivered with care."
    >
      <p>
        Online Pooja Stores is an online shop for everyday and festival pooja
        needs — incense, diyas, garlands, camphor, bells and more — brought to
        your doorstep with Cash on Delivery across India.
      </p>
      <p>
        We are run by {SITE.owner} under {SITE.company}, based in Hyderabad,
        Telangana. Our aim is simple: good-quality pooja samagri, fair prices,
        and reliable delivery, so your worship is never interrupted by a missing
        item.
      </p>
      <h2>Why shop with us</h2>
      <ul>
        <li>Hand-picked, good-quality pooja items.</li>
        <li>Cash on Delivery — pay only when your order arrives.</li>
        <li>Free shipping on orders over ₹{SITE.freeShippingOver}.</li>
        <li>Fast delivery across Hyderabad, Telangana and all of India.</li>
      </ul>
      <p>
        Have a question or a special requirement? We’d love to help — see our{' '}
        <a href="/contact">Contact</a> page.
      </p>
    </PageShell>
  );
}
