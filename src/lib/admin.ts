import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Returns the signed-in user only if their profile is flagged is_admin,
// otherwise null. Server-only (reads auth cookies). Grant access with:
//   update public.profiles set is_admin = true where email = '...';
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.is_admin ? user : null;
}

// Throws in a Server Action / route if the caller isn't an admin.
export async function assertAdmin(): Promise<void> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");
}
