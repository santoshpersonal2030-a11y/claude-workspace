import type { Metadata, Viewport } from "next";
import { Marcellus, Mukta } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Providers from "./providers";
import AnnouncementBar from "@/components/AnnouncementBar";
import ReferralTracker from "@/components/ReferralTracker";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SkipLink from "@/components/SkipLink";
import LiveRegion from "@/components/LiveRegion";
import InstallPrompt from "@/components/InstallPrompt";
import Analytics from "@/components/Analytics";
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n";

const heading = Marcellus({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
});

const body = Mukta({
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  subsets: ["latin", "devanagari"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bookmypoojari.com";

// Pre-render both locales at build time (per Next.js 16 i18n routing).
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// English lives at clean URLs ("/poojas"); other locales are prefixed
// ("/hi/poojas"). Build the canonical + hreflang alternates accordingly.
function localizedPath(locale: Locale, path = "") {
  const clean = path ? `/${path}` : "";
  return locale === DEFAULT_LOCALE ? clean || "/" : `/${locale}${clean}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "BookMyPoojari — Book Verified Pandits & Pooja Samagri Online",
      template: "%s | BookMyPoojari",
    },
    description:
      "Book experienced, verified Pandits for any pooja or ceremony at home, and order authentic pooja samagri kits — delivered to your door. Trusted, transparent, on time.",
    keywords: [
      "book pandit online",
      "poojari booking",
      "pooja samagri",
      "online pooja",
      "griha pravesh",
      "satyanarayan katha",
      "pandit for puja",
    ],
    alternates: {
      canonical: localizedPath(loc),
      languages: {
        en: "/",
        hi: "/hi",
        "x-default": "/",
      },
    },
    openGraph: {
      title: "BookMyPoojari — Book Verified Pandits & Pooja Samagri Online",
      description:
        "Book verified Pandits for any ceremony and order authentic pooja samagri, delivered to your door.",
      type: "website",
      siteName: "BookMyPoojari",
      locale: loc === "hi" ? "hi_IN" : "en_IN",
      url: localizedPath(loc),
    },
    twitter: {
      card: "summary_large_image",
      title: "BookMyPoojari — Book Verified Pandits & Pooja Samagri Online",
      description:
        "Book verified Pandits for any ceremony and order authentic pooja samagri, delivered to your door.",
    },
    appleWebApp: {
      capable: true,
      title: "BookMyPoojari",
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/icon-192.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#d4540a",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SkipLink />
        <Analytics />
        <LiveRegion />
        <AnnouncementBar />
        <ReferralTracker />
        <ServiceWorkerRegister />
        <Providers locale={locale}>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
