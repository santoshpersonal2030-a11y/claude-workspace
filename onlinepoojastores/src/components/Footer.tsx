import Link from 'next/link';
import { SITE } from '@/lib/site';

const LINKS = [
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
  { href: '/shipping', label: 'Shipping & Returns' },
  { href: '/faq', label: 'FAQ' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gold/40 bg-burgundy-dark text-cream">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-gold font-semibold">{SITE.name}</p>
            <p className="mt-1 text-cream/80">
              {SITE.company}, Hyderabad, Telangana
            </p>
            <p className="mt-1 text-cream/80">
              Cash on Delivery across India · Free shipping over ₹
              {SITE.freeShippingOver}
            </p>
            <p className="mt-1 text-cream/80">
              <a href={`mailto:${SITE.email}`} className="hover:text-gold">
                {SITE.email}
              </a>
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-cream/80 hover:text-gold">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-6 text-xs text-cream/60">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
