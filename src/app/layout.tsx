import type { Metadata, Viewport } from "next";
import { Marcellus, Mukta } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AnnouncementBar from "@/components/AnnouncementBar";
import ReferralTracker from "@/components/ReferralTracker";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import SkipLink from "@/components/SkipLink";

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

export const metadata: Metadata = {
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
  alternates: { canonical: "/" },
  openGraph: {
    title: "BookMyPoojari — Book Verified Pandits & Pooja Samagri Online",
    description:
      "Book verified Pandits for any ceremony and order authentic pooja samagri, delivered to your door.",
    type: "website",
    siteName: "BookMyPoojari",
    locale: "en_IN",
    url: siteUrl,
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

export const viewport: Viewport = {
  themeColor: "#d4540a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SkipLink />
        <AnnouncementBar />
        <ReferralTracker />
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
