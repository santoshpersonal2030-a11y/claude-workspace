"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function str(value: FormDataEntryValue | null): string {
  return ((value as string) ?? "").trim();
}

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/profile");

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      full_name: str(formData.get("full_name")) || null,
      phone: str(formData.get("phone")) || null,
      marketing_consent: formData.get("marketing_consent") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/account/profile");
}
