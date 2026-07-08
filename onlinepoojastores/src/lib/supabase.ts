import { createClient } from '@supabase/supabase-js';

// A single Supabase client for reading public storefront data (products,
// categories, shipping). Uses the publishable/anon key, so Row Level Security
// still applies — it can only ever read what the security rules allow publicly.
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your keys.',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
