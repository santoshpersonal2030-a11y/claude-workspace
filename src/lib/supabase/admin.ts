import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

// Service-role Supabase client that BYPASSES Row Level Security.
//
// SERVER-ONLY — never import this into a Client Component or expose the key to
// the browser. Use it from trusted server routes (e.g. payment verification)
// that need to write protected status columns the user shouldn't control.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
