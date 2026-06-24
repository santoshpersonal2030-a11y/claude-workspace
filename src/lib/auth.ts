import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user (or null) in Server Components, Server Actions and
// Route Handlers. Uses getUser() — which revalidates the token with Supabase —
// rather than getSession(), so it is safe to trust for authorization checks.
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
