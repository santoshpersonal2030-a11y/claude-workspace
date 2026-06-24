import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsultationBookingForm from "@/components/ConsultationBookingForm";
import { consultations, getConsultation } from "@/lib/consultations";
import { formatINR } from "@/lib/poojas";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export function generateStaticParams() {
  return consultations.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getConsultation(slug);
  if (!service) return { title: "Consultation not found" };
  return { title: service.name, description: service.shortDescription };
}

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const { t } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const service = getConsultation(slug);
  if (!service) notFound();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="bg-temple-gradient">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <nav className="text-sm text-foreground/65">
              <Link href="/consultations" className="hover:text-saffron-700">
                {t("consult.crumb")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-saffron-700">{service.name}</span>
            </nav>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{service.emoji}</span>
                <div>
                  <h1 className="font-heading text-3xl text-maroon-800">
                    {service.name}
                  </h1>
                  {service.sanskritName && (
                    <p className="text-sm text-foreground/55">
                      {service.sanskritName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-saffron-800">
                  {t("consult.minutes", { mins: service.durationMins })}
                </span>
                <span className="rounded-full bg-saffron-50 px-3 py-1 text-saffron-800">
                  {t("consult.phoneOrVideo")}
                </span>
                <span className="rounded-full bg-saffron-50 px-3 py-1 font-semibold text-saffron-800">
                  {formatINR(service.price)}
                </span>
              </div>

              <p className="mt-5 text-foreground/75 leading-relaxed">
                {service.longDescription ?? service.shortDescription}
              </p>

              {service.includes && service.includes.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-heading text-lg text-maroon-700">
                    {t("consult.included")}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {service.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-foreground/75"
                      >
                        <span className="mt-0.5 text-saffron-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 lg:self-start">
              <ConsultationBookingForm service={service} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
