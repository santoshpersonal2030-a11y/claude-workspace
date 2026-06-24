// SERVER-ONLY reader for astrologer live presence (online/busy/offline). The
// roster identity + rates are seed data in astrologers.ts; this is the mutable
// "are they available right now" layer, stored in live_astrologer_status. Public
// data, but we read it through the admin client so a server component can render
// it without a user session.

import { createAdminClient } from "@/lib/supabase/admin";

export type PresenceStatus = "online" | "busy" | "offline";

export type Presence = { status: PresenceStatus; note: string | null };

const OFFLINE: Presence = { status: "offline", note: null };

function normalise(status: string | null): PresenceStatus {
  return status === "online" || status === "busy" ? status : "offline";
}

// slug → presence for the whole roster. Falls back to an empty map (everyone
// offline) if the table or service key is unavailable (e.g. during build).
export async function getPresenceMap(): Promise<Record<string, Presence>> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("live_astrologer_status")
      .select("slug, status, note");
    const map: Record<string, Presence> = {};
    for (const row of data ?? []) {
      map[row.slug] = { status: normalise(row.status), note: row.note };
    }
    return map;
  } catch (err) {
    console.error("getPresenceMap failed:", err);
    return {};
  }
}

export async function getPresence(slug: string): Promise<Presence> {
  const map = await getPresenceMap();
  return map[slug] ?? OFFLINE;
}
