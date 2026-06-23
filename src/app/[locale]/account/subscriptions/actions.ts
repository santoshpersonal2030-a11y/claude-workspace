"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { nextRunDate, type Cadence } from "@/lib/recurrence";

function str(value: FormDataEntryValue | null): string {
  return ((value as string) ?? "").trim();
}

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Creates a recurring-pooja subscription for the signed-in user. RLS scopes the
// insert to their own user_id.
export async function createSubscription(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/subscriptions");

  const cadence: Cadence =
    str(formData.get("cadence")) === "monthly" ? "monthly" : "weekly";
  const anchor_day =
    cadence === "weekly"
      ? Math.min(6, Math.max(0, Number(formData.get("weekday")) || 0))
      : Math.min(28, Math.max(1, Number(formData.get("monthday")) || 1));

  const pooja_id = str(formData.get("pooja_id"));
  const time_slot = str(formData.get("time_slot"));
  const address = str(formData.get("address"));
  const city = str(formData.get("city"));
  if (!pooja_id || !time_slot || !address || !city) return;

  await supabase.from("pooja_subscriptions").insert({
    user_id: user.id,
    pooja_id,
    cadence,
    anchor_day,
    time_slot,
    address,
    city,
    pincode: str(formData.get("pincode")) || null,
    language: str(formData.get("language")) || null,
    samagri_kit: formData.get("samagri_kit") === "on",
    next_run: nextRunDate(cadence, anchor_day, todayIST()),
  });

  revalidatePath("/account/subscriptions");
}

// Pause/resume a subscription (RLS confines this to the owner's rows).
export async function setSubscriptionActive(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = str(formData.get("id"));
  if (!id) return;
  await supabase
    .from("pooja_subscriptions")
    .update({
      active: str(formData.get("active")) === "true",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/account/subscriptions");
}

export async function deleteSubscription(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = str(formData.get("id"));
  if (!id) return;
  await supabase.from("pooja_subscriptions").delete().eq("id", id);

  revalidatePath("/account/subscriptions");
}
