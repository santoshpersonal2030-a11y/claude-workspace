"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type PoojaCategory = Database["public"]["Enums"]["pooja_category"];

function num(value: FormDataEntryValue | null): number {
  return Math.max(0, Math.round(Number(value) || 0));
}

function optNum(value: FormDataEntryValue | null): number | null {
  const v = (value as string)?.trim();
  if (!v) return null;
  return Math.max(0, Math.round(Number(v) || 0));
}

function str(value: FormDataEntryValue | null): string {
  return ((value as string) ?? "").trim();
}

// ── Products ───────────────────────────────────────────────────────────────

export async function saveProduct(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const payload = {
    slug: str(formData.get("slug")),
    name: str(formData.get("name")),
    description: str(formData.get("description")) || null,
    category: str(formData.get("category")) || null,
    price: num(formData.get("price")),
    mrp: optNum(formData.get("mrp")),
    stock: num(formData.get("stock")),
    image_url: str(formData.get("image_url")) || null,
    active: formData.get("active") === "on",
  };

  if (id) {
    await admin.from("products").update(payload).eq("id", id);
  } else {
    await admin.from("products").insert(payload);
  }

  revalidatePath("/admin/products");
  revalidatePath("/store");
}

// ── Poojas ───────────────────────────────────────────────────────────────

export async function savePooja(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const payload = {
    name: str(formData.get("name")),
    category: str(formData.get("category")) as PoojaCategory,
    starting_price: num(formData.get("starting_price")),
    samagri_kit_price: optNum(formData.get("samagri_kit_price")),
    duration_hours: Number(formData.get("duration_hours")) || 1,
    popular: formData.get("popular") === "on",
    active: formData.get("active") === "on",
  };

  await admin.from("poojas").update(payload).eq("id", id);

  revalidatePath("/admin/poojas");
  revalidatePath("/poojas");
}

// ── Bookings & orders status ────────────────────────────────────────────────

export async function updateBookingStatus(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const status = str(formData.get("status")) as BookingStatus;
  await admin.from("bookings").update({ status }).eq("id", id);

  revalidatePath("/admin/bookings");
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const status = str(formData.get("status")) as OrderStatus;
  await admin.from("orders").update({ status }).eq("id", id);

  revalidatePath("/admin/bookings");
}
