import Link from "next/link";
import HeaderAuth from "@/components/HeaderAuth";
import CartButton from "@/components/CartButton";
import WishlistNavButton from "@/components/WishlistNavButton";

const navLinks = [
  { href: "/poojas", label: "Book a Pooja" },
  { href: "/ceremonies", label: "Ceremonies" },
  { href: "/muhurat", label: "Shubh Muhurat" },
  { href: "/store", label: "Samagri Store" },
  { href: "/pandits", label: "Our Pandits" },
  { href: "/how-it-works", label: "How It Works" },
];

export default function Header() {
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
              Devotion, delivered.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-saffron-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <WishlistNavButton />
          <CartButton />
          <HeaderAuth />
          <Link
            href="/poojas"
            className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
          >
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
