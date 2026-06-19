import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

// Supabase client for use in Client Components ("use client").
// Reads the public env vars that are inlined into the browser bundle.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
