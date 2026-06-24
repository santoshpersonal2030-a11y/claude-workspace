import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

const sections = [
  {
    h: "Booking cancellations",
    p: "You may cancel a pooja booking up to 24 hours before the scheduled time for a full refund. Cancellations within 24 hours are eligible for a 50% refund, as the Pandit will have reserved the slot.",
  },
  {
    h: "Rescheduling",
    p: "You can reschedule a booking once, free of charge, at least 12 hours before the ceremony, subject to Pandit availability.",
  },
  {
    h: "Samagri orders",
    p: "Unopened samagri kits can be returned within 3 days of delivery for a refund, minus shipping. Perishable or opened items are non-returnable for hygiene reasons.",
  },
  {
    h: "Refund processing",
    p: "Approved refunds are credited to your original payment method within 5–7 business days via Razorpay.",
  },
  {
    h: "How to request",
    p: "To cancel or request a refund, contact us with your booking or order reference and we will assist you promptly.",
  },
];

export default function RefundPolicyPage() {
  return (
    <ContentPage
      title="Refund & Cancellation Policy"
      intro="Last updated: June 2026"
    >
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
