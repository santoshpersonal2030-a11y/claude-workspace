"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

// Client-side auth control for the header. Reading the session on the client
// keeps the surrounding pages (catalog, home) statically cacheable instead of
// forcing per-request rendering.
export default function HeaderAuth() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      setLoaded(true);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .maybeSingle();
        setIsAdmin(Boolean(profile?.is_admin));
      } else {
        setIsAdmin(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Escape closes the open menu.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  }

  // Avoid a flash of the wrong control before the session is known.
  if (!loaded) return <span className="h-9 w-16" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-foreground/80 transition-colors hover:text-saffron-700"
      >
        Sign in
      </Link>
    );
  }

  const label = user.phone
    ? `+${user.phone}`
    : (user.email ?? "Account");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-100 text-sm font-semibold text-saffron-700 transition-colors hover:bg-saffron-200"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
      >
        {(user.email ?? user.phone ?? "U").charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          id="account-menu"
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-saffron-100 bg-white py-1 shadow-lg"
        >
          <div className="truncate px-4 py-2 text-xs text-foreground/50">
            {label}
          </div>
          <Link
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground/80 hover:bg-saffron-50"
            role="menuitem"
          >
            My account
          </Link>
          <Link
            href="/account/bookings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground/80 hover:bg-saffron-50"
            role="menuitem"
          >
            My bookings
          </Link>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground/80 hover:bg-saffron-50"
            role="menuitem"
          >
            My orders
          </Link>
          <Link
            href="/account/wishlist"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground/80 hover:bg-saffron-50"
            role="menuitem"
          >
            Saved items
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block border-t border-saffron-50 px-4 py-2 text-sm font-medium text-saffron-700 hover:bg-saffron-50"
              role="menuitem"
            >
              Admin console
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="block w-full px-4 py-2 text-left text-sm text-maroon-700 hover:bg-saffron-50"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
