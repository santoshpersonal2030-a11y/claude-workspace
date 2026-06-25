"use client";

import { useState } from "react";
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
  { href: "/live-astrology", key: "nav.liveAstrology" },
  { href: "/horoscope", key: "nav.horoscope" },
  { href: "/panchang", key: "nav.panchang" },
  { href: "/calendar", key: "nav.calendar" },
  { href: "/store", key: "nav.store" },
  { href: "/pandits", key: "nav.pandits" },
  { href: "/how-it-works", key: "nav.howItWorks" },
];

export default function Header() {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-saffron-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
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

          <div className="flex shrink-0 items-center gap-3">
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
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-foreground/70 transition-colors hover:bg-saffron-50 hover:text-saffron-700 md:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        <nav
          className="hidden flex-wrap items-center justify-start gap-x-3 gap-y-2 pb-3 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full bg-saffron-100 px-4 py-2 text-sm font-medium text-maroon-700 transition-colors hover:bg-saffron-200"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-t border-saffron-100 bg-cream/95 px-4 py-2 sm:px-6 md:hidden"
        >
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-saffron-50 hover:text-saffron-700"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-3 border-t border-saffron-100 px-3 pt-3 sm:hidden">
            <LanguageSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
