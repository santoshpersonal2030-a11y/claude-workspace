"use client";

import Link from "next/link";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/components/LanguageProvider";

/* The link tree, as dictionary keys rather than English text.
 *
 * This MUST be built inside the component, not at module scope. It used to be a module-level
 * `const columns` holding English strings; translating it in place by calling t() there would
 * have looked right and been worse — a module constant is evaluated once, when the file first
 * loads, so the whole footer would freeze in whichever language happened to render first and
 * then show that language to everyone. Only the shape lives out here; the words are resolved
 * per render below.
 */
const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "footer.poojas",
    links: [
      { href: "/poojas", label: "footer.allPoojas" },
      { href: "/temple-puja", label: "footer.templeEPuja" },
      {
        href: "/poojas/satyanarayan-katha",
        label: "footer.pooja.satyanarayanKatha",
      },
      { href: "/poojas/griha-pravesh", label: "footer.pooja.grihaPravesh" },
      { href: "/poojas/lakshmi-puja", label: "footer.pooja.lakshmiPuja" },
    ],
  },
  {
    title: "footer.shop",
    links: [
      { href: "/store", label: "nav.store" },
      { href: "/store?category=Puja+Kits", label: "footer.poojaKits" },
      { href: "/store?category=Diyas+%26+Lamps", label: "footer.diyasLamps" },
    ],
  },
  {
    title: "footer.almanac",
    links: [
      { href: "/horoscope", label: "footer.dailyHoroscope" },
      { href: "/kundli", label: "footer.freeKundli" },
      { href: "/consultations", label: "footer.astrologyConsultation" },
      { href: "/muhurat", label: "footer.shubhMuhurat" },
      { href: "/panchang", label: "footer.dailyPanchang" },
      { href: "/choghadiya", label: "footer.choghadiya" },
      { href: "/gun-milan", label: "footer.kundliMatching" },
      { href: "/festivals", label: "footer.festivalsVrats" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { href: "/about", label: "footer.aboutUs" },
      { href: "/pandits", label: "footer.ourPandits" },
      { href: "/become-a-pandit", label: "footer.becomeAPandit" },
      { href: "/blog", label: "footer.blog" },
      { href: "/contact", label: "footer.contact" },
    ],
  },
  {
    title: "footer.policies",
    links: [
      { href: "/terms", label: "footer.terms" },
      { href: "/privacy", label: "footer.privacy" },
      { href: "/refund-policy", label: "footer.refund" },
    ],
  },
];

export default function Footer() {
  const t = useT();
  const columns = COLUMNS.map((col) => ({
    key: col.title,
    title: t(col.title),
    links: col.links.map((l) => ({ href: l.href, label: t(l.label) })),
  }));
  return (
    <footer className="mt-auto border-t border-saffron-100 bg-maroon-700 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[1.4fr_repeat(5,1fr)]">
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
            <div key={col.key}>
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

        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-cream-100/60 sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <p>{t("footer.madeWithDevotion")}</p>
        </div>
      </div>
    </footer>
  );
}
