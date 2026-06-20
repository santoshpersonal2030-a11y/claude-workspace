"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRefund, razorpayConfigured } from "@/lib/razorpay";
import {
  sendReviewRequest,
  sendBackInStockEmails,
  sendOrderStatusUpdate,
} from "@/lib/notifications";
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

// Parses a bounded decimal (e.g. a 0–5 rating).
function clampFloat(value: FormDataEntryValue | null, max: number): number {
  const n = Number(value) || 0;
  return Math.min(max, Math.max(0, n));
}

// Splits "Hindi, Sanskrit, Marathi" into ["Hindi","Sanskrit","Marathi"].
function csvToArray(value: FormDataEntryValue | null): string[] {
  return str(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Products ───────────────────────────────────────────────────────────────

const IMAGE_BUCKET = "product-images";

// Uploads an image file to Storage and returns its public URL, or null.
async function uploadProductImage(
  admin: ReturnType<typeof createAdminClient>,
  file: File,
  slug: string,
): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${slug || "product"}/${Date.now()}.${ext}`;
  const { error } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
  if (error) {
    console.error("Product image upload failed:", error.message);
    return null;
  }
  return admin.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function saveProduct(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const slug = str(formData.get("slug"));

  // Gallery URLs come from the client image manager (JSON array).
  let images: string[] = [];
  const imagesRaw = str(formData.get("images"));
  if (imagesRaw) {
    try {
      const parsed = JSON.parse(imagesRaw);
      if (Array.isArray(parsed)) images = parsed.filter((u) => typeof u === "string");
    } catch {
      // ignore malformed input
    }
  }

  // A server-uploaded file or pasted URL provides the cover.
  let cover = str(formData.get("image_url")) || null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadProductImage(admin, file, slug);
    if (uploaded) cover = uploaded;
  }
  // Fall back to the first gallery image for the cover.
  cover = cover ?? images[0] ?? null;

  const stock = num(formData.get("stock"));

  const payload = {
    slug,
    name: str(formData.get("name")),
    description: str(formData.get("description")) || null,
    category: str(formData.get("category")) || null,
    price: num(formData.get("price")),
    mrp: optNum(formData.get("mrp")),
    stock,
    image_url: cover,
    images,
    active: formData.get("active") === "on",
  };

  if (id) {
    // Detect an out-of-stock → in-stock transition to notify wishlisters.
    const { data: existing } = await admin
      .from("products")
      .select("stock")
      .eq("id", id)
      .maybeSingle();
    await admin.from("products").update(payload).eq("id", id);
    if (existing && existing.stock <= 0 && stock > 0) {
      await sendBackInStockEmails(id);
    }
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

// ── Pandits ─────────────────────────────────────────────────────────────────

export async function savePandit(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const payload = {
    slug: str(formData.get("slug")),
    full_name: str(formData.get("full_name")),
    bio: str(formData.get("bio")) || null,
    experience_years: num(formData.get("experience_years")),
    languages: csvToArray(formData.get("languages")),
    regions: csvToArray(formData.get("regions")),
    rating: clampFloat(formData.get("rating"), 5),
    review_count: num(formData.get("review_count")),
    verified: formData.get("verified") === "on",
    active: formData.get("active") === "on",
  };

  if (id) {
    await admin.from("pandits").update(payload).eq("id", id);
  } else {
    await admin.from("pandits").insert(payload);
  }

  revalidatePath("/admin/pandits");
  revalidatePath("/pandits");
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

  const update: {
    status: OrderStatus;
    tracking_number?: string | null;
    estimated_delivery?: string | null;
    carrier?: string | null;
  } = { status };
  if (formData.has("tracking_number")) {
    update.tracking_number = str(formData.get("tracking_number")) || null;
  }
  if (formData.has("estimated_delivery")) {
    update.estimated_delivery = str(formData.get("estimated_delivery")) || null;
  }
  if (formData.has("carrier")) {
    update.carrier = str(formData.get("carrier")) || null;
  }
  await admin.from("orders").update(update).eq("id", id);

  // Email the customer about the transition; delivery also invites a review.
  if (status === "delivered") {
    await sendReviewRequest(id);
    await sendOrderStatusUpdate(id, status);
  } else if (
    status === "packed" ||
    status === "shipped" ||
    status === "cancelled"
  ) {
    await sendOrderStatusUpdate(id, status);
  }

  revalidatePath("/admin/bookings");
}

// ── Order items (admin order detail) ────────────────────────────────────────

async function recomputeOrderTotals(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
): Promise<void> {
  const { data: items } = await admin
    .from("order_items")
    .select("line_total")
    .eq("order_id", orderId);
  const subtotal = (items ?? []).reduce((s, i) => s + i.line_total, 0);
  const { data: order } = await admin
    .from("orders")
    .select("shipping")
    .eq("id", orderId)
    .maybeSingle();
  const shipping = order?.shipping ?? 0;
  await admin
    .from("orders")
    .update({ subtotal, total_amount: subtotal + shipping })
    .eq("id", orderId);
}

export async function updateOrderItem(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const itemId = str(formData.get("item_id"));
  const quantity = Math.max(1, num(formData.get("quantity")));

  const { data: item } = await admin
    .from("order_items")
    .select("order_id, unit_price")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  await admin
    .from("order_items")
    .update({ quantity, line_total: item.unit_price * quantity })
    .eq("id", itemId);
  await recomputeOrderTotals(admin, item.order_id);
  revalidatePath(`/admin/orders/${item.order_id}`);
}

export async function removeOrderItem(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const itemId = str(formData.get("item_id"));

  const { data: item } = await admin
    .from("order_items")
    .select("order_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return;

  await admin.from("order_items").delete().eq("id", itemId);
  await recomputeOrderTotals(admin, item.order_id);
  revalidatePath(`/admin/orders/${item.order_id}`);
}

// Full edit of a booking from the admin booking detail page.
export async function updateBookingDetails(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const id = str(formData.get("id"));

  await admin
    .from("bookings")
    .update({
      booking_date: str(formData.get("booking_date")),
      time_slot: str(formData.get("time_slot")),
      language: str(formData.get("language")) || null,
      address: str(formData.get("address")),
      city: str(formData.get("city")),
      notes: str(formData.get("notes")) || null,
      status: str(formData.get("status")) as BookingStatus,
      pandit_id: str(formData.get("pandit_id")) || null,
    })
    .eq("id", id);

  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
}

// Refunds an order's payment via Razorpay. Blank amount = full refund (also
// cancels the order). Partial refunds track the cumulative refunded amount.
export async function refundOrder(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const orderId = str(formData.get("id"));
  const amountInr = num(formData.get("amount")); // 0 → full refund

  const { data: payment } = await admin
    .from("payments")
    .select("id, amount, refunded_amount, razorpay_payment_id, status")
    .eq("order_id", orderId)
    .eq("payment_for", "order")
    .maybeSingle();

  if (!payment?.razorpay_payment_id || !razorpayConfigured()) return;

  const remaining = payment.amount - payment.refunded_amount;
  const refundInr = amountInr > 0 ? Math.min(amountInr, remaining) : remaining;
  if (refundInr <= 0) return;

  try {
    await createRefund({
      paymentId: payment.razorpay_payment_id,
      amountInPaise: amountInr > 0 ? refundInr * 100 : undefined,
      notes: { order_id: orderId },
    });
  } catch (err) {
    console.error("refundOrder failed:", err);
    return;
  }

  const newRefunded = payment.refunded_amount + refundInr;
  const fullyRefunded = newRefunded >= payment.amount;

  await admin
    .from("payments")
    .update({
      refunded_amount: newRefunded,
      status: fullyRefunded ? "refunded" : payment.status,
    })
    .eq("id", payment.id);

  if (fullyRefunded) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  }

  revalidatePath(`/admin/orders/${orderId}`);
}

// Assigns (or clears) the actual pandit on a booking. Assigning also advances a
// still-open booking to "assigned"; clearing leaves the status untouched.
export async function assignPandit(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const panditId = str(formData.get("pandit_id")) || null;

  const update: { pandit_id: string | null; status?: BookingStatus } = {
    pandit_id: panditId,
  };
  if (panditId) {
    const currentStatus = str(formData.get("current_status")) as BookingStatus;
    if (currentStatus === "pending" || currentStatus === "confirmed") {
      update.status = "assigned";
    }
  }

  await admin.from("bookings").update(update).eq("id", id);
  revalidatePath("/admin/bookings");
}

// ── Contact messages ────────────────────────────────────────────────────────

export async function setMessageHandled(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const handled = formData.get("handled") === "true";
  await admin.from("contact_messages").update({ handled }).eq("id", id);

  revalidatePath("/admin/messages");
}
