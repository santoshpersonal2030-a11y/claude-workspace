// SERVER-ONLY coupon validation + redemption. Codes are validated authoritatively
// against the DB (service role), so the client can never set its own discount.

import { createAdminClient } from "@/lib/supabase/admin";

export type CouponResult = {
  ok: boolean;
  code?: string;
  discount: number;
  reason?: string;
};

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

// Validates a code against an order subtotal (whole INR) and returns the
// discount it would grant. Never throws.
export async function validateCoupon(
  rawCode: string,
  subtotal: number,
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, discount: 0, reason: "Enter a code" };

  try {
    const admin = createAdminClient();
    const { data: c } = await admin
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!c || !c.active) return { ok: false, discount: 0, reason: "Invalid code" };
    if (c.expires_at && c.expires_at < todayIST()) {
      return { ok: false, discount: 0, reason: "This code has expired" };
    }
    if (c.usage_limit != null && c.used_count >= c.usage_limit) {
      return { ok: false, discount: 0, reason: "This code is fully redeemed" };
    }
    if (subtotal < c.min_order) {
      return {
        ok: false,
        discount: 0,
        reason: `Minimum order of ₹${c.min_order} for this code`,
      };
    }

    let discount =
      c.type === "percent"
        ? Math.round((subtotal * c.value) / 100)
        : Math.round(c.value);
    if (c.max_discount != null) discount = Math.min(discount, c.max_discount);
    discount = Math.min(discount, subtotal);

    return { ok: true, code: c.code, discount };
  } catch {
    return { ok: false, discount: 0, reason: "Could not check the code" };
  }
}

// Best-effort redemption counter (after a successful order).
export async function incrementCouponUse(code: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("coupons")
      .select("used_count")
      .eq("code", code)
      .maybeSingle();
    if (data) {
      await admin
        .from("coupons")
        .update({ used_count: data.used_count + 1 })
        .eq("code", code);
    }
  } catch {
    /* best-effort */
  }
}
