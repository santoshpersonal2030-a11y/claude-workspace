import type { Metadata } from "next";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections = [
  {
    h: "1. Information we collect",
    p: "We collect the details you provide when you sign in or place a booking/order — such as your name, phone number, email, and delivery or ceremony address — and basic usage data.",
  },
  {
    h: "2. How we use it",
    p: "We use your information to confirm and fulfil bookings and orders, assign a Pandit, process payments, provide support, and (with your consent) send updates about our services.",
  },
  {
    h: "3. Payments",
    p: "Payments are processed by Razorpay. We do not store your full card or banking details on our servers.",
  },
  {
    h: "4. Sharing",
    p: "We share only the information necessary to fulfil your request — for example, the ceremony address with the assigned Pandit, or delivery details with our courier. We do not sell your data.",
  },
  {
    h: "5. Data security",
    p: "We use industry-standard measures to protect your data, including encrypted connections and access controls on our database.",
  },
  {
    h: "6. Your choices",
    p: "You can opt out of marketing messages at any time and request access to or deletion of your personal data by contacting us.",
  },
];

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy" intro="Last updated: June 2026">
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
