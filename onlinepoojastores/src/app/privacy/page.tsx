import type { Metadata } from 'next';
import PageShell from '@/components/PageShell';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy · Online Pooja Stores',
  description: 'How Online Pooja Stores collects, uses and protects your information.',
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: 2026">
      <p>
        {SITE.name} (“we”, “us”) respects your privacy. This policy explains what
        we collect and how we use it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Your name, phone number and delivery address, to fulfil orders.</li>
        <li>Your email address, to create your account and send order updates.</li>
        <li>Order and payment details (we do not store card numbers).</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders.</li>
        <li>To send order confirmations and updates.</li>
        <li>To improve our products and service.</li>
      </ul>

      <h2>How it’s protected</h2>
      <p>
        Your data is stored securely with our hosting and database providers.
        Access is restricted, and each customer can only see their own orders
        and addresses.
      </p>

      <h2>Payments</h2>
      <p>
        Online payments are processed by our payment partner. We receive a
        confirmation of payment but never see or store your full card or bank
        details.
      </p>

      <h2>Sharing</h2>
      <p>
        We share your details only with delivery partners and payment providers
        as needed to complete your order. We do not sell your data.
      </p>

      <h2>Your choices</h2>
      <p>
        You can request access to, correction of, or deletion of your account
        data by contacting us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </PageShell>
  );
}
