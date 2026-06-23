// SERVER-ONLY: per-booking chat between customer, assigned pandit and admins.
// booking_messages is service-role only, so every access goes through these
// helpers, which first verify the caller is a participant of the booking.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChatRole = "customer" | "pandit" | "admin";

export type Participant = {
  userId: string;
  role: ChatRole;
  booking: {
    id: string;
    user_id: string;
    pandit_id: string | null;
    preferred_pandit_id: string | null;
    poojaName: string;
  };
};

export type ChatMessage = {
  id: string;
  sender_role: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
};

// Resolves the signed-in user's role on a booking, or null if they're not a
// participant. Admins can join any thread.
export async function getParticipant(
  bookingId: string,
): Promise<Participant | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, pandit_id, preferred_pandit_id, poojas(name)")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;

  const base = {
    id: booking.id,
    user_id: booking.user_id,
    pandit_id: booking.pandit_id,
    preferred_pandit_id: booking.preferred_pandit_id,
    poojaName: booking.poojas?.name ?? "your ceremony",
  };

  if (booking.user_id === user.id) {
    return { userId: user.id, role: "customer", booking: base };
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin) return { userId: user.id, role: "admin", booking: base };

  const { data: pandit } = await admin
    .from("pandits")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (
    pandit &&
    (pandit.id === booking.pandit_id || pandit.id === booking.preferred_pandit_id)
  ) {
    return { userId: user.id, role: "pandit", booking: base };
  }
  return null;
}

export async function listMessages(bookingId: string): Promise<ChatMessage[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("booking_messages")
    .select("id, sender_role, sender_id, body, created_at, read_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

// Marks the counterpart's messages in this thread as read by the caller.
export async function markThreadRead(
  bookingId: string,
  userId: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("booking_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

// Posts a message and notifies the other participants.
export async function sendMessage(
  p: Participant,
  body: string,
): Promise<ChatMessage | null> {
  const text = body.trim();
  if (!text) return null;
  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("booking_messages")
    .insert({
      booking_id: p.booking.id,
      sender_id: p.userId,
      sender_role: p.role,
      body: text.slice(0, 4000),
    })
    .select("id, sender_role, sender_id, body, created_at, read_at")
    .single();

  await notifyOthers(p, text);
  return msg;
}

// Notifies the customer and the assigned pandit's account (whoever isn't the
// sender). Admins use the support inbox rather than per-message notifications.
async function notifyOthers(p: Participant, body: string): Promise<void> {
  const admin = createAdminClient();
  const recipients: { userId: string; link: string }[] = [];

  if (p.booking.user_id !== p.userId) {
    recipients.push({
      userId: p.booking.user_id,
      link: `/account/bookings/${p.booking.id}`,
    });
  }
  const panditId = p.booking.pandit_id ?? p.booking.preferred_pandit_id;
  if (panditId) {
    const { data: pandit } = await admin
      .from("pandits")
      .select("user_id")
      .eq("id", panditId)
      .maybeSingle();
    if (pandit?.user_id && pandit.user_id !== p.userId) {
      recipients.push({ userId: pandit.user_id, link: `/priest/messages` });
    }
  }
  if (recipients.length === 0) return;

  const fromLabel =
    p.role === "customer" ? "the customer" : p.role === "pandit" ? "your Pandit" : "the BookMyPoojari team";
  await admin.from("notifications").insert(
    recipients.map((r) => ({
      user_id: r.userId,
      type: "message",
      title: `New message about ${p.booking.poojaName}`,
      body: `${body.slice(0, 120)} — from ${fromLabel}`,
      link: r.link,
    })),
  );
}
