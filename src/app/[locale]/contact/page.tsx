import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the BookMyPoojari team for help with bookings, samagri orders, or to become a verified Pandit.",
};

const channels = [
  { label: "Email", value: "support@bookmypoojari.com", icon: "✉️" },
  { label: "Phone / WhatsApp", value: "+91 90000 00000", icon: "📞" },
  { label: "Hours", value: "Mon–Sun, 8 AM – 9 PM IST", icon: "🕉️" },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <h1 className="font-heading text-4xl text-maroon-800">Contact Us</h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              Questions about a booking or order, or want to join as a Pandit?
              We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              {channels.map((c) => (
                <div
                  key={c.label}
                  className="flex items-start gap-3 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <div className="text-xs text-foreground/65">{c.label}</div>
                    <div className="mt-0.5 font-medium text-maroon-700">
                      {c.value}
                    </div>
                  </div>
                </div>
              ))}
              <p className="px-1 text-sm text-foreground/65">
                Are you a Pandit interested in joining our verified network? Send
                us a message with your experience and city — we&apos;ll be in
                touch.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
