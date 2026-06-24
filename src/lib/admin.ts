import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { can, type AdminRole, type Capability } from "@/lib/roles";

export type AdminContext = { user: User; role: AdminRole | null };

// Returns the signed-in admin and their role, or null if not an admin.
// is_admin gates console access; admin_role refines which sections they can use
// (a legacy admin with no role is treated as an owner for back-compat).
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, admin_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) return null;
  const role = (profile.admin_role as AdminRole | null) ?? "owner";
  return { user, role };
}

// Returns the signed-in user only if they're an admin, otherwise null.
export async function getAdminUser(): Promise<User | null> {
  const ctx = await getAdminContext();
  return ctx?.user ?? null;
}

// Throws in a Server Action / route if the caller isn't an admin.
export async function assertAdmin(): Promise<void> {
  const ctx = await getAdminContext();
  if (!ctx) throw new Error("Unauthorized");
}

// Throws if the caller lacks a capability — use in sensitive server actions.
export async function assertCapability(cap: Capability): Promise<void> {
  const ctx = await getAdminContext();
  if (!ctx || !can(ctx.role, cap)) throw new Error("Forbidden");
}

// Page guard: redirect non-admins to login and admins lacking `cap` back to the
// console home.
export async function requireCapability(cap: Capability): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/login?next=/admin");
  if (!can(ctx.role, cap)) redirect("/admin");
  return ctx;
}
