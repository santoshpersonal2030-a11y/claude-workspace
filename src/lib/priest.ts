// Priest self-service: resolves the pandit profile linked to the signed-in
// user. A pandit is linked either by user_id (cached) or by login_email
// matching the account email. Server-only (reads auth cookies). Portal pages
// then query via the service-role client, ALWAYS filtered to this pandit's id —
// never trusting a client-supplied id.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

export type PanditRow = Database["public"]["Tables"]["pandits"]["Row"];

export async function getPriestPandit(): Promise<PanditRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  // Fast path: already linked by user_id.
  const byId = await admin
    .from("pandits")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (byId.data) return byId.data;

  // Otherwise match the account email to a pandit's login_email, then cache it.
  if (user.email) {
    const byEmail = await admin
      .from("pandits")
      .select("*")
      .ilike("login_email", user.email)
      .maybeSingle();
    if (byEmail.data) {
      await admin
        .from("pandits")
        .update({ user_id: user.id })
        .eq("id", byEmail.data.id);
      return { ...byEmail.data, user_id: user.id };
    }
  }

  return null;
}

// Throws in a priest server action / route if the caller isn't a linked priest;
// returns the pandit row otherwise.
export async function assertPriest(): Promise<PanditRow> {
  const pandit = await getPriestPandit();
  if (!pandit) throw new Error("Unauthorized");
  return pandit;
}
