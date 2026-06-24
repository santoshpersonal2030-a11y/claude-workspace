"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function str(value: FormDataEntryValue | null): string {
  return ((value as string) ?? "").trim();
}

export async function addAddress(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/addresses");

  const address = str(formData.get("address"));
  const city = str(formData.get("city"));
  if (!address || !city) return;
  const makeDefault = formData.get("is_default") === "on";

  if (makeDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }
  await supabase.from("addresses").insert({
    user_id: user.id,
    label: str(formData.get("label")) || null,
    address,
    city,
    pincode: str(formData.get("pincode")) || null,
    is_default: makeDefault,
  });

  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = str(formData.get("id"));
  if (!id) return;

  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);
  await supabase.from("addresses").update({ is_default: true }).eq("id", id);

  revalidatePath("/account/addresses");
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = str(formData.get("id"));
  if (!id) return;
  await supabase.from("addresses").delete().eq("id", id);
  revalidatePath("/account/addresses");
}
