import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Shipping & Returns · Online Pooja Stores',
  description:
    'Shipping charges, delivery times, and returns policy for Online Pooja Stores.',
};

export default function ShippingPage() {
  return (
    <PageShell title="Shipping & Returns">
      <h2>Shipping charges</h2>
      <p>Free shipping on all orders over ₹{SITE.freeShippingOver}. Otherwise:</p>
      <ul>
        <li>Hyderabad / Secunderabad (pincodes 500001–500109): ₹49</li>
        <li>Rest of Telangana: ₹79</li>
        <li>Rest of India: ₹149</li>
      </ul>

      <h2>Delivery time</h2>
      <p>
        Orders are usually dispatched within 1–2 working days. Estimated
        delivery is 2–4 days within Telangana and 4–7 days for the rest of
        India. You’ll see your order status update in your account.
      </p>

      <h2>Payment</h2>
      <p>
        We offer Cash on Delivery (pay when your order arrives). Online payment
        options may also be available at checkout.
      </p>

      <h2>Returns &amp; replacements</h2>
      <p>
        If an item arrives damaged, defective, or incorrect, contact us within
        48 hours of delivery with your order number and a photo, and we’ll
        arrange a replacement or refund. For hygiene and ritual-purity reasons,
        opened consumable items (such as camphor, oils, and incense) can’t be
        returned unless they’re faulty.
      </p>

      <h2>Cancellations</h2>
      <p>
        You can cancel an order before it’s dispatched by contacting us as soon
        as possible. Once shipped, an order can’t be cancelled but may be
        returned as above.
      </p>

      <p>
        Questions? Reach us via the <a href="/contact">Contact</a> page.
      </p>
    </PageShell>
  );
}
