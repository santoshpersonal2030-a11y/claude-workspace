"use client";

import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import CartButton from "@/components/CartButton";
import WishlistNavButton from "@/components/WishlistNavButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/NotificationBell";
import { useT } from "@/components/LanguageProvider";

const navLinks = [
  { href: "/poojas", key: "nav.bookPooja" },
  { href: "/temple-puja", key: "nav.templePuja" },
  { href: "/ceremonies", key: "nav.ceremonies" },
  { href: "/muhurat", key: "nav.muhurat" },
  { href: "/consultations", key: "nav.consultations" },
  { href: "/panchang", key: "nav.panchang" },
  { href: "/store", key: "nav.store" },
  { href: "/pandits", key: "nav.pandits" },
  { href: "/how-it-works", key: "nav.howItWorks" },
];

export default function Header() {
  const t = useT();
  return (
    <header className="sticky top-0 z-50 border-b border-saffron-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-600 text-xl shadow-sm">
            🪔
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg text-maroon-700">
              BookMyPoojari
            </span>
            <span className="block text-[11px] tracking-wide text-saffron-700">
              {t("brand.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-saffron-700"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            aria-label={t("search.title")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-base text-foreground/70 transition-colors hover:bg-saffron-50 hover:text-saffron-700"
          >
            🔎
          </Link>
          <LanguageSwitcher className="hidden sm:flex" />
          <NotificationBell />
          <WishlistNavButton />
          <CartButton />
          <HeaderAuth />
          <Link
            href="/poojas"
            className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-800"
          >
            {t("nav.bookPooja")}
          </Link>
        </div>
      </div>
    </header>
  );
}
