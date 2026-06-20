import type { Metadata } from "next";
import Link from "next/link";
import ContentPage from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Booking a verified Pandit on BookMyPoojari takes four simple steps — choose your pooja, pick a date, pay securely, and we handle the rest.",
};

const steps = [
  {
    emoji: "📿",
    title: "Choose your pooja",
    body: "Browse our catalog of ceremonies — from Satyanarayan Katha to Griha Pravesh — and pick the one you need. Each listing explains what's included.",
  },
  {
    emoji: "📅",
    title: "Pick a date & add samagri",
    body: "Select an auspicious date and time slot, your preferred language, and optionally add a ready-made samagri kit so you don't have to shop for items.",
  },
  {
    emoji: "💳",
    title: "Pay securely",
    body: "Sign in and pay online via Razorpay — UPI, cards, or net banking. Your booking is confirmed instantly with a receipt.",
  },
  {
    emoji: "🙏",
    title: "We assign a verified Pandit",
    body: "We match you with an experienced, verified priest for your ceremony and location. They arrive prepared, on time, and perform the rituals with devotion.",
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPage
      title="How It Works"
      intro="Booking an authentic ceremony is simple — here's what to expect."
    >
      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
          >
            <div className="text-3xl">{step.emoji}</div>
            <div>
              <h2 className="font-heading text-lg text-maroon-700">
                {i + 1}. {step.title}
              </h2>
              <p className="mt-1 text-sm text-foreground/70">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl bg-saffron-50 p-6 text-center">
        <h3 className="font-heading text-xl text-maroon-700">
          Ready to begin?
        </h3>
        <p className="mt-1 text-sm text-foreground/65">
          Find the right ceremony for your occasion.
        </p>
        <Link
          href="/poojas"
          className="mt-4 inline-block rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
        >
          Browse poojas
        </Link>
      </div>
    </ContentPage>
  );
}
