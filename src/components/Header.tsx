"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeaderAuth from "@/components/HeaderAuth";
import CartButton from "@/components/CartButton";
import WishlistNavButton from "@/components/WishlistNavButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/NotificationBell";
import { useT } from "@/components/LanguageProvider";

const navLinks = [
  { href: "/pandits", key: "nav.pandits" },
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
  { href: "/how-it-works", key: "nav.howItWorks" },
];

export default function Header() {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-saffron-100 bg-cream/90 backdrop-blur">
      {/* Tighter padding and gap on phones only. Together with dropping the search icon this is
          what buys back the 76px the header used to overflow by at 360px. */}
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-3 sm:gap-4">
          {/* `min-w-0` rather than `shrink-0`. Both this block and the icon cluster opposite were
              marked never-shrink, so on a 360px phone the header needed 436px, the page scrolled
              sideways and the ☰ button was clipped off the right edge — on every page, in every
              language. Dropping the search icon on phones (below) reclaims most of that; this is
              the backstop that means the header can never overflow again at any width, in any
              language, whatever is added to it later. The wordmark truncates as a last resort. */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            {/* shrink-0 so the logo circle keeps its shape. Without it the min-w-0 above lets
                the flex layout squash it from 40px to 32px and the artwork distorts. */}
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm sm:h-10 sm:w-10">
              <Image
                src="/icon-192.png"
                alt="BookMyPoojari"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-heading text-base text-maroon-700 sm:text-lg">
                BookMyPoojari
              </span>
              <span className="block truncate text-[11px] tracking-wide text-saffron-700">
                {t("brand.tagline")}
              </span>
            </span>
          </Link>

          {/* gap-2 on phones, gap-3 from 640px up: four gaps at 12px was 48px of the overflow. */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Hidden on phones — it is the least-used control in this row and the most
                expensive, at 36px plus a gap. Search has NOT gone away: it is the first item in
                the ☰ menu below. Shown again from 768px up, where the full nav bar appears. */}
            <Link
              href="/search"
              aria-label={t("search.title")}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-base text-foreground/70 transition-colors hover:bg-saffron-50 hover:text-saffron-700 md:flex"
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
              aria-label={t(menuOpen ? "a11y.closeMenu" : "a11y.openMenu")}
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
          aria-label={t("a11y.primaryNav")}
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
          aria-label={t("a11y.primaryNavMobile")}
          className="border-t border-saffron-100 bg-cream/95 px-4 py-2 sm:px-6 md:hidden"
        >
          <ul className="flex flex-col">
            {/* Search lives here on phones, in place of the header icon that was dropped.
                First in the list so it is the first thing under the thumb. */}
            <li>
              <Link
                href="/search"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-saffron-50 hover:text-saffron-700"
              >
                🔎 {t("search.title")}
              </Link>
            </li>
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
