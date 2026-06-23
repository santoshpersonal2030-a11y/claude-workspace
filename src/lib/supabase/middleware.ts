import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

// Refreshes the Supabase auth session on every request and writes any rotated
// auth cookies back onto the response. Called from the root middleware.
// When `rewriteUrl` is supplied (e.g. locale routing), the response rewrites to
// it instead of passing through, while still carrying the refreshed cookies.
export async function updateSession(request: NextRequest, rewriteUrl?: URL) {
  const build = () =>
    rewriteUrl
      ? NextResponse.rewrite(rewriteUrl, { request })
      : NextResponse.next({ request });

  let supabaseResponse = build();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = build();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser() — it
  // keeps the session fresh and avoids hard-to-debug logout bugs.
  await supabase.auth.getUser();

  return supabaseResponse;
}
