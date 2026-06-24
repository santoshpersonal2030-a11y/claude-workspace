import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "Terms & Conditions" };

const sections = [
  {
    h: "1. Overview",
    p: "BookMyPoojari (“we”, “us”) provides a platform to book Hindu priests for ceremonies and to purchase pooja samagri. By using the site you agree to these terms.",
  },
  {
    h: "2. Bookings",
    p: "A booking is confirmed once payment is received. We assign a verified Pandit based on your ceremony, date, language and location. Timings are approximate and may vary with the muhurat and travel.",
  },
  {
    h: "3. Pricing & payment",
    p: "All prices are in Indian Rupees (INR) and inclusive of applicable taxes unless stated otherwise. Payments are processed securely through Razorpay; we do not store your card details.",
  },
  {
    h: "4. Samagri orders",
    p: "Product images are indicative. We aim to deliver fresh, authentic items; in case an item is unavailable we will offer a suitable substitute or refund.",
  },
  {
    h: "5. Conduct",
    p: "Customers agree to provide a safe and respectful environment for the priest to perform the ceremony. We reserve the right to decline or cancel service in case of abusive behaviour.",
  },
  {
    h: "6. Liability",
    p: "Our liability for any booking or order is limited to the amount paid for that booking or order. We are not liable for outcomes attributed to the ceremony itself.",
  },
  {
    h: "7. Changes",
    p: "We may update these terms from time to time. Continued use of the site constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <ContentPage title="Terms & Conditions" intro="Last updated: June 2026">
      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.h}>
            <h2 className="font-heading text-lg text-maroon-700">{s.h}</h2>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              {s.p}
            </p>
          </div>
        ))}
        <p className="text-xs text-foreground/65">
          This is a general template and not legal advice. Please have it
          reviewed by a qualified professional before launch.
        </p>
      </div>
    </ContentPage>
  );
}
