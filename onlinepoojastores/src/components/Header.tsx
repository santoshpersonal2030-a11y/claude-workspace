import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-burgundy text-cream shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🪔
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-wide text-gold">
              Online Pooja Stores
            </span>
            <span className="text-[11px] text-cream/80">
              Pooja essentials, delivered
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/" className="hover:text-gold">
            Shop
          </Link>
          <span
            className="cursor-not-allowed text-cream/50"
            title="Coming soon"
          >
            Cart
          </span>
        </nav>
      </div>
    </header>
  );
}
