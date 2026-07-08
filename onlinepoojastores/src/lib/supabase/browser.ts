import { createBrowserClient } from '@supabase/ssr';

// Supabase client for use in the browser (Client Components). Keeps the user's
// session in cookies so the server can read it too.
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
