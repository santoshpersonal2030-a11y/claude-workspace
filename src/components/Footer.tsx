"use client";

import Link from "next/link";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/components/LanguageProvider";

const columns = [
  {
    title: "Poojas",
    links: [
      { href: "/poojas", label: "All Poojas" },
      { href: "/poojas/satyanarayan-katha", label: "Satyanarayan Katha" },
      { href: "/poojas/griha-pravesh", label: "Griha Pravesh" },
      { href: "/poojas/lakshmi-puja", label: "Lakshmi Puja" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/store", label: "Samagri Store" },
      { href: "/store?category=Puja+Kits", label: "Pooja Kits" },
      { href: "/store?category=Diyas+%26+Lamps", label: "Diyas & Lamps" },
    ],
  },
  {
    title: "Almanac",
    links: [
      { href: "/muhurat", label: "Shubh Muhurat" },
      { href: "/panchang", label: "Daily Panchang" },
      { href: "/choghadiya", label: "Choghadiya" },
      { href: "/gun-milan", label: "Kundli Matching" },
      { href: "/festivals", label: "Festivals & Vrats" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/pandits", label: "Our Pandits" },
      { href: "/become-a-pandit", label: "Become a Pandit" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund & Cancellation" },
    ],
  },
];

export default function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-saffron-100 bg-maroon-700 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-600 text-xl">
                🪔
              </span>
              <span className="font-heading text-lg text-white">
                BookMyPoojari
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-cream-100/80">
              {t("footer.tagline")}
            </p>
            <LanguageSwitcher className="mt-4 w-fit border-white/20 bg-white/10" />
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="font-heading text-sm text-gold-400">
                {col.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-100/80 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-cream-100/60 sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p>Made with devotion in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
