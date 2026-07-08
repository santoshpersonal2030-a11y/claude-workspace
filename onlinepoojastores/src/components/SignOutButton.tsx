'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/browser';

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createBrowserSupabase().auth.signOut();
        router.push('/');
        router.refresh();
      }}
      className="rounded-lg border border-burgundy px-4 py-2 text-sm font-semibold text-burgundy transition hover:bg-burgundy hover:text-cream"
    >
      Sign out
    </button>
  );
}
