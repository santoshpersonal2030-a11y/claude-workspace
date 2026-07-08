import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import CartLink from './CartLink';

export default async function Header() {
  let signedIn = false;
  let isAdmin = false;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = !!profile?.is_admin;
    }
  } catch {
    // If Supabase isn't configured yet, just show the signed-out header.
  }

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
          <CartLink />
          {isAdmin && (
            <Link href="/admin" className="hover:text-gold">
              Admin
            </Link>
          )}
          {signedIn && (
            <Link href="/wishlist" className="hover:text-gold">
              Wishlist
            </Link>
          )}
          {signedIn ? (
            <Link href="/account" className="hover:text-gold">
              Account
            </Link>
          ) : (
            <Link href="/login" className="hover:text-gold">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
