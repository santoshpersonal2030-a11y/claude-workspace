import { createClient } from '@supabase/supabase-js';

// A plain client for reading PUBLIC storefront data (products, categories,
// shipping) in server components. No cookies/session needed — Row Level
// Security still limits it to publicly-readable data.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your keys.',
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
