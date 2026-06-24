"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin, assertCapability, getAdminContext } from "@/lib/admin";
import { can } from "@/lib/roles";
import { decryptKyc, getKycKey } from "@/lib/kyc-crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRefund, razorpayConfigured } from "@/lib/razorpay";
import { generateEInvoice, cancelEInvoice } from "@/lib/einvoice";
import { generateEwayBill, updateEwayBillPartB } from "@/lib/ewaybill";
import { saveCompany } from "@/lib/company-settings";
import { buildRunItems } from "@/lib/payroll-data";
import { runPayout } from "@/lib/payouts";
import { adjustWallet } from "@/lib/wallet";
import {
  generateAbhijitCandidates,
  generateCeremonyCandidates,
  generateChoghadiyaCandidates,
  CITY_COORDS,
} from "@/lib/muhurat-engine";
import {
  sendReviewRequest,
  sendBackInStockEmails,
  sendOrderStatusUpdate,
  sendRefundConfirmation,
  sendCreditNoteEmail,
  notifyPriestAssignment,
  notifyCustomerPriestAccepted,
} from "@/lib/notifications";
import { logPriestEvent } from "@/lib/booking-events";
import { NUDGE_COOLDOWN_MIN } from "@/lib/nudge";
import type { Database } from "@/lib/database.types";
import { Constants } from "@/lib/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type PoojaCategory = Database["public"]["Enums"]["pooja_category"];
type RitualType = Database["public"]["Enums"]["ritual_type"];
type CouponType = Database["public"]["Enums"]["coupon_type"];
type PriestResponse = Database["public"]["Enums"]["priest_response"];

// Fields that reset a booking's priest accept/decline state — applied whenever
// the admin (re)assigns a priest so the new assignee gets a fresh decision.
const RESET_PRIEST_RESPONSE = {
  priest_response: "pending" as PriestResponse,
  priest_responded_at: null,
  decline_reason: null,
  declined_by_pandit_id: null,
  proposed_date: null,
  proposed_time: null,
};

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

// Splits "Hindi, Sanskrit, Marathi" into ["Hindi","Sanskrit","Marathi"].
function csvToArray(value: FormDataEntryValue | null): string[] {
  return str(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Splits a textarea into one entry per line — used for qualifications and
// achievements, whose entries may themselves contain commas.
function linesToArray(value: FormDataEntryValue | null): string[] {
  return str(value)
    .split("\n")
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
    gst_rate: formData.has("gst_rate")
      ? clampFloat(formData.get("gst_rate"), 28)
      : 18,
    hsn_code: str(formData.get("hsn_code")) || null,
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
  const includes = linesToArray(formData.get("includes"));
  const payload = {
    name: str(formData.get("name")),
    category: str(formData.get("category")) as PoojaCategory,
    ritual_type: str(formData.get("ritual_type")) as RitualType,
    starting_price: num(formData.get("starting_price")),
    samagri_kit_price: optNum(formData.get("samagri_kit_price")),
    duration_hours: Number(formData.get("duration_hours")) || 1,
    long_description: str(formData.get("long_description")) || null,
    includes: includes.length > 0 ? includes : null,
    popular: formData.get("popular") === "on",
    requires_muhurat: formData.get("requires_muhurat") === "on",
    active: formData.get("active") === "on",
  };

  await admin.from("poojas").update(payload).eq("id", id);

  revalidatePath("/admin/poojas");
  revalidatePath("/poojas");
}

// ── Pandits ─────────────────────────────────────────────────────────────────

// Uploads a priest photo to Storage and returns its public URL, or null.
async function uploadPanditPhoto(
  admin: ReturnType<typeof createAdminClient>,
  file: File,
  slug: string,
): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${slug || "pandit"}/${Date.now()}.${ext}`;
  const { error } = await admin.storage
    .from("pandit-photos")
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
  if (error) {
    console.error("Pandit photo upload failed:", error.message);
    return null;
  }
  return admin.storage.from("pandit-photos").getPublicUrl(path).data.publicUrl;
}

export async function savePandit(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const slug = str(formData.get("slug"));

  // Photo: a freshly uploaded file wins, else keep the pasted/existing URL.
  let photoUrl = str(formData.get("photo_url")) || null;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadPanditPhoto(admin, file, slug);
    if (uploaded) photoUrl = uploaded;
  }

  const payload = {
    slug,
    full_name: str(formData.get("full_name")),
    bio: str(formData.get("bio")) || null,
    experience_years: num(formData.get("experience_years")),
    languages: csvToArray(formData.get("languages")),
    regions: csvToArray(formData.get("regions")),
    specializations: csvToArray(formData.get("specializations")),
    qualifications: linesToArray(formData.get("qualifications")),
    achievements: linesToArray(formData.get("achievements")),
    login_email: str(formData.get("login_email")) || null,
    phone: str(formData.get("phone")) || null,
    photo_url: photoUrl,
    home_pincode: str(formData.get("home_pincode")) || null,
    service_pincodes: csvToArray(formData.get("service_pincodes")),
    max_travel_mins: num(formData.get("max_travel_mins")) || 30,
    work_start: str(formData.get("work_start")) || "06:00",
    work_end: str(formData.get("work_end")) || "21:00",
    blackout_dates: csvToArray(formData.get("blackout_dates")),
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
  if (slug) revalidatePath(`/pandits/${slug}`);
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

// Confirms a booking's time: assigns the priest and anchors the exact start/end
// (e.g. after agreeing a muhurat with the customer), flipping it to "confirmed".
// Anchoring the time engages the bookings_no_overlap constraint, so the booking
// now blocks that priest's calendar. A clash is swallowed (constraint error) so
// the admin UI doesn't crash — the booking stays unconfirmed to retry.
// ── Muhurat calendar ─────────────────────────────────────────────────────

export async function saveMuhuratWindow(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const payload = {
    date: str(formData.get("date")),
    start_time: str(formData.get("start_time")),
    end_time: str(formData.get("end_time")),
    category: (str(formData.get("category")) || null) as PoojaCategory | null,
    pooja_slug: str(formData.get("pooja_slug")) || null,
    label: str(formData.get("label")) || null,
    note: str(formData.get("note")) || null,
    approved: formData.get("approved") === "on",
    source: str(formData.get("source")) || "manual",
  };
  if (!payload.date || !payload.start_time || !payload.end_time) return;

  if (id) {
    await admin.from("muhurat_windows").update(payload).eq("id", id);
  } else {
    await admin.from("muhurat_windows").insert(payload);
  }
  revalidatePath("/admin/muhurat");
}

export async function deleteMuhuratWindow(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (id) await admin.from("muhurat_windows").delete().eq("id", id);
  revalidatePath("/admin/muhurat");
}

// Bulk-imports muhurat windows from pasted CSV — one window per line:
//   date, start, end, scope, label, note
// `scope` is a pooja slug, a category name, or blank (all ceremonies). This is
// source-agnostic: candidates from any panchang source/engine can be pasted in,
// always landing UNAPPROVED so an astrologer still gates what customers see.
export async function importMuhuratWindows(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const raw = str(formData.get("csv"));
  if (!raw) return;

  const categories = new Set<string>(
    Constants.public.Enums.pooja_category.map((c) => c.toLowerCase()),
  );
  const categoryByLower = new Map(
    Constants.public.Enums.pooja_category.map((c) => [c.toLowerCase(), c]),
  );

  const rows: Database["public"]["Tables"]["muhurat_windows"]["Insert"][] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip an optional header row.
    if (/^date\s*,/i.test(trimmed)) continue;

    const parts = trimmed.split(",").map((s) => s.trim());
    const [date, start, end, scope = "", label = ""] = parts;
    const note = parts.slice(5).join(",").trim();
    if (!date || !start || !end) continue;

    const scopeLower = scope.toLowerCase();
    const isCategory = categories.has(scopeLower);

    rows.push({
      date,
      start_time: start,
      end_time: end,
      category: isCategory
        ? (categoryByLower.get(
            scopeLower,
          ) as Database["public"]["Enums"]["pooja_category"])
        : null,
      pooja_slug: !isCategory && scope ? scope : null,
      label: label || null,
      note: note || null,
      approved: false,
      source: "import",
    });
  }

  if (rows.length > 0) {
    await admin.from("muhurat_windows").insert(rows);
  }
  revalidatePath("/admin/muhurat");
}

// Generates Abhijit-Muhurat candidates over a date range from the pure
// astronomical engine (no API) and inserts them as PENDING windows for the
// chosen city + scope. Always unapproved so an astrologer still gates them.
export async function generateMuhuratWindows(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const from = str(formData.get("from"));
  const to = str(formData.get("to"));
  const city = str(formData.get("city")) || "New Delhi";
  if (!from || !to) return;

  const coords = CITY_COORDS[city] ?? CITY_COORDS["New Delhi"];
  const mode = str(formData.get("mode"));
  const strict = formData.get("strict") === "on";
  let scope = str(formData.get("scope"));

  let candidates;
  if (mode === "ceremony" || mode === "vivah") {
    // The selected pooja drives the ceremony's classical rules; default to the
    // wedding ceremony when nothing specific is chosen.
    const ruleSlug = scope || "vivah-sanskar";
    if (!scope) scope = "vivah-sanskar";
    candidates = generateCeremonyCandidates(
      ruleSlug,
      from,
      to,
      coords.lat,
      coords.lng,
      strict,
    );
  } else if (mode === "choghadiya") {
    // Auspicious daytime choghadiya slots; the "strict" toggle doubles as
    // "include Char" here (Char is movable — useful but not top-tier).
    candidates = generateChoghadiyaCandidates(
      from,
      to,
      coords.lat,
      coords.lng,
      strict,
    );
  } else {
    candidates = generateAbhijitCandidates(from, to, coords.lat, coords.lng);
  }
  if (candidates.length === 0) return;
  const scopeLower = scope.toLowerCase();
  const isCategory = Constants.public.Enums.pooja_category.some(
    (c) => c.toLowerCase() === scopeLower,
  );
  const category = isCategory
    ? (Constants.public.Enums.pooja_category.find(
        (c) => c.toLowerCase() === scopeLower,
      ) as Database["public"]["Enums"]["pooja_category"])
    : null;
  const poojaSlug = !isCategory && scope ? scope : null;

  const rows = candidates.map((c) => ({
    date: c.date,
    start_time: c.start_time,
    end_time: c.end_time,
    category,
    pooja_slug: poojaSlug,
    label: c.label,
    note: `${city}: ${c.note}`,
    quality_score: c.quality_score ?? null,
    approved: false,
    source: "computed",
  }));

  await admin.from("muhurat_windows").insert(rows);
  revalidatePath("/admin/muhurat");
}

export async function confirmBookingTime(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const panditId = str(formData.get("pandit_id")) || null;
  const date = str(formData.get("confirm_date"));
  const time = str(formData.get("confirm_time"));
  if (!id || !panditId || !date || !time) return;

  const { data: booking } = await admin
    .from("bookings")
    .select("pooja_id")
    .eq("id", id)
    .maybeSingle();
  if (!booking?.pooja_id) return;

  const { data: pooja } = await admin
    .from("poojas")
    .select("duration_hours")
    .eq("id", booking.pooja_id)
    .maybeSingle();
  const durationHours = Number(pooja?.duration_hours ?? 1);

  const startsAt = new Date(`${date}T${time}:00+05:30`).toISOString();
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationHours * 3_600_000,
  ).toISOString();

  const { error } = await admin
    .from("bookings")
    .update({
      pandit_id: panditId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "confirmed",
      ...RESET_PRIEST_RESPONSE,
    })
    .eq("id", id);
  if (error) {
    // Most likely bookings_no_overlap — the priest is already busy then.
    console.warn("confirmBookingTime conflict:", error.message);
  } else {
    // Log the assignment and ask the priest to accept or decline the slot.
    await logPriestEvent({ bookingId: id, panditId, action: "assigned" });
    await notifyPriestAssignment(id);
  }

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

// Requests an IRN/e-invoice from the IRP for a B2B order.
export async function generateEInvoiceAction(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const orderId = str(formData.get("id"));
  await generateEInvoice(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

// Cancels an order's e-invoice (IRN) within the 24-hour window.
export async function cancelEInvoiceAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const orderId = str(formData.get("id"));
  await cancelEInvoice(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

// Generates an e-way bill for a consignment over the threshold.
export async function generateEwayBillAction(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const orderId = str(formData.get("id"));
  await generateEwayBill(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

// One-click: generate the e-invoice (IRN) and then the e-way bill.
export async function generateEInvoiceAndEwbAction(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const orderId = str(formData.get("id"));
  await generateEInvoice(orderId);
  await generateEwayBill(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
}

// Bulk: generate e-invoice (IRN) + e-way bill for each selected order in one
// pass. Each generator is a safe no-op when not applicable (B2C / below
// threshold / already issued), so a mixed selection is fine.
export async function bulkGenerateEInvoicesAction(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const ids = formData
    .getAll("order_ids")
    .map((v) => String(v))
    .filter(Boolean);

  for (const orderId of ids) {
    await generateEInvoice(orderId);
    await generateEwayBill(orderId);
  }

  revalidatePath("/admin/bookings");
}

// Updates the e-way bill Part-B (vehicle details).
export async function updateEwayBillPartBAction(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const orderId = str(formData.get("id"));
  await updateEwayBillPartB(orderId, str(formData.get("vehicle")));
  revalidatePath(`/admin/orders/${orderId}`);
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
    .select("id, amount, refunded_amount, razorpay_payment_id, status, user_id")
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

  // Issue an FY-numbered credit note for the refund.
  const { data: creditNote } = await admin
    .from("credit_notes")
    .insert({
      order_id: orderId,
      payment_id: payment.id,
      user_id: payment.user_id,
      amount: refundInr,
      reason: str(formData.get("reason")) || null,
    })
    .select("invoice_no, invoice_fy, amount, reason")
    .single();

  await sendRefundConfirmation(orderId, refundInr);
  if (creditNote) {
    await sendCreditNoteEmail({
      orderId,
      userId: payment.user_id,
      creditNote,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
}

// Refunds an order as store credit instead of to the card. Credits the
// customer's wallet (idempotent per order via the ledger's unique index) and
// cancels the order when fully covered. No money movement / GST credit note —
// use refundOrder for a cash refund to source.
export async function refundOrderToCredit(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const orderId = str(formData.get("id"));
  if (!orderId) return;

  const { data: order } = await admin
    .from("orders")
    .select("user_id, total_amount")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const amount = num(formData.get("amount")) || order.total_amount;
  if (amount <= 0) return;

  const granted = await adjustWallet(
    order.user_id,
    amount,
    "refund",
    str(formData.get("reason")) || "Refund issued as store credit",
    { orderId },
  );
  if (granted && amount >= order.total_amount) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  }
  revalidatePath(`/admin/orders/${orderId}`);
}

// Refunds a booking as store credit (e.g. a no-show/quality dispute outcome).
// Credits the wallet (idempotent per booking) and cancels the booking when
// fully covered. No Razorpay money movement.
export async function refundBookingToCredit(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const bookingId = str(formData.get("id"));
  if (!bookingId) return;

  const { data: booking } = await admin
    .from("bookings")
    .select("user_id, total_amount")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return;

  const amount = num(formData.get("amount")) || booking.total_amount;
  if (amount <= 0) return;

  const granted = await adjustWallet(
    booking.user_id,
    amount,
    "refund",
    str(formData.get("reason")) || "Booking refund issued as store credit",
    { bookingId },
  );
  if (granted && amount >= booking.total_amount) {
    await admin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
  }
  revalidatePath(`/admin/bookings/${bookingId}`);
}

// Assigns (or clears) the actual pandit on a booking. Assigning also advances a
// still-open booking to "assigned"; clearing leaves the status untouched.
export async function assignPandit(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const panditId = str(formData.get("pandit_id")) || null;

  const update: {
    pandit_id: string | null;
    status?: BookingStatus;
  } & typeof RESET_PRIEST_RESPONSE = {
    pandit_id: panditId,
    ...RESET_PRIEST_RESPONSE,
  };
  if (panditId) {
    const currentStatus = str(formData.get("current_status")) as BookingStatus;
    if (currentStatus === "pending" || currentStatus === "confirmed") {
      update.status = "assigned";
    }
  }

  await admin.from("bookings").update(update).eq("id", id);
  // Log the assignment and ask the priest to accept or decline (best-effort).
  if (panditId) {
    await logPriestEvent({ bookingId: id, panditId, action: "assigned" });
    await notifyPriestAssignment(id);
  }
  revalidatePath("/admin/bookings");
}

// Re-sends the accept/decline request to a priest who hasn't responded yet
// (a "nudge"). Only acts on a booking still assigned to that priest and awaiting
// their response, and is rate-limited to once per NUDGE_COOLDOWN_MIN so it can't
// be spammed.
export async function nudgePriest(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (!id) return;

  const { data: booking } = await admin
    .from("bookings")
    .select("id, pandit_id, priest_response, last_nudged_at")
    .eq("id", id)
    .maybeSingle();
  if (!booking?.pandit_id || booking.priest_response !== "pending") return;

  // Cooldown: skip silently if nudged within the window.
  if (booking.last_nudged_at) {
    const elapsedMin =
      (Date.now() - new Date(booking.last_nudged_at).getTime()) / 60000;
    if (elapsedMin < NUDGE_COOLDOWN_MIN) return;
  }

  await notifyPriestAssignment(id);
  await admin
    .from("bookings")
    .update({ last_nudged_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

// Admin accepts a priest's counter-offer: apply the proposed date/time, mark the
// priest accepted, clear the proposal, and tell the customer their Pandit is
// confirmed for the new time.
export async function acceptProposal(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (!id) return;

  const { data: b } = await admin
    .from("bookings")
    .select("id, pandit_id, priest_response, proposed_date, proposed_time, time_slot")
    .eq("id", id)
    .maybeSingle();
  if (!b || b.priest_response !== "proposed" || !b.proposed_date) return;

  await admin
    .from("bookings")
    .update({
      booking_date: b.proposed_date,
      time_slot: b.proposed_time ?? b.time_slot,
      priest_response: "accepted",
      proposed_date: null,
      proposed_time: null,
      starts_at: null,
      ends_at: null,
      priest_responded_at: new Date().toISOString(),
    })
    .eq("id", id);

  await logPriestEvent({ bookingId: id, panditId: b.pandit_id, action: "accepted" });
  await notifyCustomerPriestAccepted(id);

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

// ── Company settings ────────────────────────────────────────────────────────

// Saves the seller/business details shown on invoices (DB-backed, editable
// without a redeploy). Revalidates the receipt pages so they pick up changes.
export async function saveCompanySettings(formData: FormData): Promise<void> {
  await assertCapability("settings");
  await saveCompany({
    name: str(formData.get("name")),
    gstin: str(formData.get("gstin")),
    state: str(formData.get("state")),
    upi: str(formData.get("upi")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    address: str(formData.get("address")),
  });
  revalidatePath("/admin/settings");
}

// ── Priest payroll ──────────────────────────────────────────────────────────

// Parses a bounded percentage (0–100) from a form field.
function pct(value: FormDataEntryValue | null): number {
  const n = Number(value) || 0;
  return Math.min(100, Math.max(0, n));
}

// Saves (upserts) a priest's compensation profile — the mix-and-match of
// salary, travel allowance, commission, dakshina retention, consultant
// retainer, incentives and statutory PF/gratuity.
export async function savePriestCompensation(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const panditId = str(formData.get("pandit_id"));
  if (!panditId) return;

  const basis = str(formData.get("commission_basis"));
  const payload = {
    pandit_id: panditId,
    model: str(formData.get("model")) as Database["public"]["Enums"]["comp_model"],
    base_salary: num(formData.get("base_salary")),
    travel_allowance: num(formData.get("travel_allowance")),
    commission_pct: pct(formData.get("commission_pct")),
    commission_basis: basis === "total" ? "total" : "service",
    keeps_dakshina: formData.get("keeps_dakshina") === "on",
    consultant_fee: num(formData.get("consultant_fee")),
    incentive_per_booking: num(formData.get("incentive_per_booking")),
    pf_enabled: formData.get("pf_enabled") === "on",
    pf_employee_pct: pct(formData.get("pf_employee_pct")),
    pf_employer_pct: pct(formData.get("pf_employer_pct")),
    pf_wage_ceiling: num(formData.get("pf_wage_ceiling")),
    gratuity_enabled: formData.get("gratuity_enabled") === "on",
    gratuity_pct: pct(formData.get("gratuity_pct")),
    notes: str(formData.get("notes")) || null,
    updated_at: new Date().toISOString(),
  };

  await admin
    .from("priest_compensation")
    .upsert(payload, { onConflict: "pandit_id" });

  revalidatePath("/admin/payroll/compensation");
}

// Creates (or reuses) the payroll run for a period and computes every active
// priest's payslip line for it. Idempotent: re-running rebuilds unpaid lines.
export async function createPayrollRun(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const year = Math.round(Number(formData.get("period_year")) || 0);
  const month = Math.round(Number(formData.get("period_month")) || 0);
  if (year < 2000 || month < 1 || month > 12) return;

  const { data: existing } = await admin
    .from("payroll_runs")
    .select("id")
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();

  let runId = existing?.id;
  if (!runId) {
    const { data: inserted } = await admin
      .from("payroll_runs")
      .insert({ period_year: year, period_month: month })
      .select("id")
      .single();
    runId = inserted?.id;
  }
  if (!runId) return;

  await buildRunItems(admin, runId, year, month);
  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${runId}`);
}

// Rebuilds the unpaid payslip lines of an existing run (e.g. after editing a
// compensation profile or marking more bookings completed).
export async function regeneratePayrollRun(formData: FormData): Promise<void> {
  await assertCapability("payroll");
  const admin = createAdminClient();

  const runId = str(formData.get("run_id"));
  if (!runId) return;
  const { data: run } = await admin
    .from("payroll_runs")
    .select("period_year, period_month")
    .eq("id", runId)
    .maybeSingle();
  if (!run) return;

  await buildRunItems(admin, runId, run.period_year, run.period_month);
  revalidatePath(`/admin/payroll/${runId}`);
}

// Marks a single payslip line paid/unpaid, recording an optional payment ref.
export async function setPayrollItemPaid(formData: FormData): Promise<void> {
  await assertCapability("payroll");
  const admin = createAdminClient();

  const id = str(formData.get("id"));
  const runId = str(formData.get("run_id"));
  if (!id) return;
  const paid = formData.get("paid") === "true";

  await admin
    .from("payroll_run_items")
    .update({
      paid,
      paid_at: paid ? new Date().toISOString() : null,
      payment_ref: paid ? str(formData.get("payment_ref")) || null : null,
    })
    .eq("id", id);

  revalidatePath(`/admin/payroll/${runId}`);
}

// Saves a priest's private bank details for RazorpayX payouts. Clearing the
// account/IFSC also drops the cached RazorpayX ids so they're rebuilt.
export async function savePayoutAccount(formData: FormData): Promise<void> {
  await assertCapability("payouts");
  const admin = createAdminClient();
  const panditId = str(formData.get("pandit_id"));
  if (!panditId) return;

  const accountNumber = str(formData.get("account_number")) || null;
  const ifsc = str(formData.get("ifsc")).toUpperCase() || null;

  await admin.from("priest_payout_accounts").upsert(
    {
      pandit_id: panditId,
      account_name: str(formData.get("account_name")) || null,
      account_number: accountNumber,
      ifsc,
      // Bank details changed → invalidate cached RazorpayX fund account.
      razorpayx_fund_account_id: null,
    },
    { onConflict: "pandit_id" },
  );
  revalidatePath("/admin/payouts");
}

// Triggers a real bank payout for one payslip line via RazorpayX.
export async function payoutPayrollItem(formData: FormData): Promise<void> {
  await assertCapability("payouts");
  const id = str(formData.get("id"));
  const runId = str(formData.get("run_id"));
  if (!id) return;
  await runPayout(id);
  if (runId) revalidatePath(`/admin/payroll/${runId}`);
  revalidatePath("/admin/payouts");
}

// Advances a run's lifecycle: draft → finalized → paid (or back to draft).
export async function setPayrollRunStatus(formData: FormData): Promise<void> {
  await assertCapability("payroll");
  const admin = createAdminClient();

  const runId = str(formData.get("run_id"));
  const status = str(formData.get("status"));
  if (!runId || !["draft", "finalized", "paid"].includes(status)) return;

  await admin
    .from("payroll_runs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", runId);

  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${runId}`);
}

// Deletes a payroll run and all its lines (cascade).
export async function deletePayrollRun(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const runId = str(formData.get("run_id"));
  if (runId) await admin.from("payroll_runs").delete().eq("id", runId);
  revalidatePath("/admin/payroll");
}

// ── Peak-day pricing ──────────────────────────────────────────────────────

// Adds/updates a peak day (festival / high-demand date) carrying a % premium
// on the dakshina. Keyed by date.
export async function savePeakDay(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();

  const date = str(formData.get("date"));
  const label = str(formData.get("label"));
  if (!date || !label) return;

  await admin.from("peak_days").upsert(
    {
      date,
      label,
      surcharge_pct: pct(formData.get("surcharge_pct")),
      active: formData.get("active") === "on",
    },
    { onConflict: "date" },
  );
  revalidatePath("/admin/peak-days");
}

export async function deletePeakDay(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const date = str(formData.get("date"));
  if (date) await admin.from("peak_days").delete().eq("date", date);
  revalidatePath("/admin/peak-days");
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

// ── Coupons ──────────────────────────────────────────────────────────────────

export async function saveCoupon(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const code = str(formData.get("code")).toUpperCase();
  const value = num(formData.get("value"));
  if (!code || value <= 0) return;

  await admin.from("coupons").upsert(
    {
      code,
      type: (str(formData.get("type")) === "flat" ? "flat" : "percent") as CouponType,
      value,
      min_order: num(formData.get("min_order")),
      max_discount: optNum(formData.get("max_discount")),
      usage_limit: optNum(formData.get("usage_limit")),
      expires_at: str(formData.get("expires_at")) || null,
      active: formData.get("active") === "on",
    },
    { onConflict: "code" },
  );
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const code = str(formData.get("code"));
  if (code) await admin.from("coupons").delete().eq("code", code);
  revalidatePath("/admin/coupons");
}

// ── Rewards (wallet / referral / loyalty) ────────────────────────────────────

export async function saveRewardSettings(formData: FormData): Promise<void> {
  await assertCapability("rewards");
  const admin = createAdminClient();
  await admin.from("reward_settings").upsert(
    {
      id: 1,
      rewards_enabled: formData.get("rewards_enabled") === "on",
      referrer_reward: num(formData.get("referrer_reward")),
      referee_reward: num(formData.get("referee_reward")),
      loyalty_earn_pct: clampFloat(formData.get("loyalty_earn_pct"), 100),
      max_redeem_pct: Math.min(100, num(formData.get("max_redeem_pct"))),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  revalidatePath("/admin/rewards");
}

// ── Blog CMS ─────────────────────────────────────────────────────────────────

export async function saveBlogPost(formData: FormData): Promise<void> {
  await assertCapability("content");
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  const slug = slugify(str(formData.get("slug")) || str(formData.get("title")));
  if (!slug) return;

  const payload = {
    slug,
    title: str(formData.get("title")),
    excerpt: str(formData.get("excerpt")),
    category: str(formData.get("category")) || "General",
    reading_minutes: num(formData.get("reading_minutes")) || 4,
    content: str(formData.get("content")),
    published: formData.get("published") === "on",
    published_at: str(formData.get("published_at")) || undefined,
  };

  if (id) {
    await admin.from("blog_posts").update(payload).eq("id", id);
  } else {
    await admin.from("blog_posts").insert(payload);
  }
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function deleteBlogPost(formData: FormData): Promise<void> {
  await assertCapability("content");
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (id) await admin.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

// ── Review moderation ────────────────────────────────────────────────────────

// Hides or restores a review. Hiding removes it from public listings; for
// pandit reviews the rating trigger recomputes the average automatically.
export async function setReviewHidden(formData: FormData): Promise<void> {
  await assertCapability("reviews");
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  const kind = str(formData.get("kind"));
  const hidden = formData.get("hidden") === "true";
  if (!id) return;

  const table = kind === "product" ? "product_reviews" : "pandit_reviews";
  await admin.from(table).update({ hidden }).eq("id", id);
  revalidatePath("/admin/reviews");
}

// ── Booking disputes ─────────────────────────────────────────────────────────

export async function resolveBookingDispute(formData: FormData): Promise<void> {
  await assertCapability("disputes");
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  if (!id || !["resolved", "rejected"].includes(status)) return;
  await admin
    .from("booking_disputes")
    .update({
      status,
      resolution_notes: str(formData.get("resolution_notes")) || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/disputes");
}

// ── Admin team (roles & permissions) ─────────────────────────────────────────

// Grants/changes/revokes an admin role for a user (owner only). The user must
// already have an account (signed in at least once) so a profile exists.
export async function saveAdminMember(formData: FormData): Promise<void> {
  await assertCapability("team");
  const admin = createAdminClient();
  const email = str(formData.get("email")).toLowerCase();
  const role = str(formData.get("role"));
  if (!email) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!profile) return;

  if (["owner", "manager", "support"].includes(role)) {
    await admin
      .from("profiles")
      .update({ is_admin: true, admin_role: role })
      .eq("id", profile.id);
  } else {
    // Anything else (incl. "revoke") removes admin access entirely.
    await admin
      .from("profiles")
      .update({ is_admin: false, admin_role: null })
      .eq("id", profile.id);
  }
  revalidatePath("/admin/team");
}

// ── Priest applications (self-onboarding / KYC) ──────────────────────────────

// Approves an application: creates a verified pandit profile from it and links
// the two. Idempotent — re-approving a linked application is a no-op.
export async function approvePanditApplication(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (!id) return;

  const { data: app } = await admin
    .from("pandit_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!app || app.created_pandit_id) return;

  // Derive a unique slug from the applicant's name.
  let slug = slugify(app.full_name) || "pandit";
  const { data: clashes } = await admin
    .from("pandits")
    .select("slug")
    .like("slug", `${slug}%`);
  const taken = new Set((clashes ?? []).map((c) => c.slug));
  if (taken.has(slug)) {
    let n = 2;
    while (taken.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }

  const { data: pandit } = await admin
    .from("pandits")
    .insert({
      slug,
      full_name: app.full_name,
      bio: app.bio,
      experience_years: app.experience_years,
      languages: app.languages ?? [],
      specializations: app.specializations ?? [],
      qualifications: app.qualifications
        ? app.qualifications.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
      regions: app.city ? [app.city] : [],
      login_email: app.email,
      phone: app.phone,
      photo_url: app.photo_url,
      home_pincode: app.home_pincode,
      verified: true,
      active: true,
    })
    .select("id, slug")
    .single();

  await admin
    .from("pandit_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      review_notes: str(formData.get("review_notes")) || null,
      created_pandit_id: pandit?.id ?? null,
    })
    .eq("id", id);

  revalidatePath("/admin/pandit-applications");
  revalidatePath("/admin/pandits");
  revalidatePath("/pandits");
  if (pandit?.slug) revalidatePath(`/pandits/${pandit.slug}`);
}

// Decrypts and returns an applicant's full KYC ID number for a single reveal.
// Gated by the "kyc" capability (owner/manager only — not support), and every
// successful reveal is written to kyc_access_log (who/which/when) so PII access
// is auditable. Returns a discriminated result rather than throwing so the UI
// can show a friendly message; only an unauthorized caller throws.
export async function revealKycId(
  applicationId: string,
): Promise<{ ok: true; idNumber: string } | { ok: false; error: string }> {
  const ctx = await getAdminContext();
  if (!ctx || !can(ctx.role, "kyc")) throw new Error("Forbidden");

  const id = applicationId.trim();
  if (!id) return { ok: false, error: "Missing application." };

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("pandit_applications")
    .select("id_number_enc")
    .eq("id", id)
    .maybeSingle();
  if (!app) return { ok: false, error: "Application not found." };
  if (!app.id_number_enc) return { ok: false, error: "No ID number on file." };

  const key = getKycKey();
  if (!key) {
    return { ok: false, error: "KYC encryption key is not configured." };
  }

  let idNumber: string;
  try {
    idNumber = decryptKyc(app.id_number_enc, key);
  } catch {
    // Wrong key, tampered ciphertext, or unrecognised format.
    return { ok: false, error: "Could not decrypt the stored ID." };
  }

  // Audit the access (best-effort — never block the reveal on logging).
  const { error: logError } = await admin
    .from("kyc_access_log")
    .insert({ application_id: id, accessed_by: ctx.user.id });
  if (logError) {
    console.error("kyc_access_log insert failed:", logError.message);
  }

  return { ok: true, idNumber };
}

export async function rejectPanditApplication(
  formData: FormData,
): Promise<void> {
  await assertAdmin();
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (!id) return;
  await admin
    .from("pandit_applications")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      review_notes: str(formData.get("review_notes")) || null,
    })
    .eq("id", id);
  revalidatePath("/admin/pandit-applications");
}

// ── Consultations (astrology / muhurat) ──────────────────────────────────────

// Fulfils a paid consultation: assign an astrologer, set the status, and (for
// video) record the meeting link the customer sees in their account.
export async function updateConsultation(formData: FormData): Promise<void> {
  await assertCapability("bookings");
  const admin = createAdminClient();
  const id = str(formData.get("id"));
  if (!id) return;

  const status = str(formData.get("status"));
  const allowed = ["pending", "confirmed", "completed", "cancelled"];

  await admin
    .from("consultation_bookings")
    .update({
      assigned_pandit_id: str(formData.get("assigned_pandit_id")) || null,
      meeting_link: str(formData.get("meeting_link")) || null,
      admin_notes: str(formData.get("admin_notes")) || null,
      ...(allowed.includes(status)
        ? {
            status: status as Database["public"]["Enums"]["consultation_status"],
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/consultations");
}
