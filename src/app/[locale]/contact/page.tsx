import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: t("meta.contact.title"), description: t("meta.contact.desc") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);

  /* Built inside the component, not at module level. A module-level constant is evaluated once
     when the file first loads, so it would freeze in whichever language rendered first and then
     serve that to everyone — the exact trap Footer.tsx had. The VALUES are data (they are the
     same in every language and come from the company record), so only the labels translate. */
  const channels = [
    { label: t("contact.email"), value: "support@bookmypoojari.com", icon: "✉️" },
    { label: t("contact.phoneWhatsapp"), value: "+91 90000 00000", icon: "📞" },
    { label: t("contact.hours"), value: t("contact.hoursValue"), icon: "🕉️" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
            <h1 className="font-heading text-4xl text-maroon-800">
              {t("contact.h1")}
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-foreground/70">
              {t("contact.intro")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
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
                {t("contact.panditNote")}
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
