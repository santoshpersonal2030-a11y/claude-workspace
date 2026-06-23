import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeReferralCode } from "@/lib/referral-code";

const REF_COOKIE = "bmp_ref";

// Attributes a referral once the referred customer is signed in. The reward
// isn't paid here — it's paid on their first completed sale (see wallet.ts).
// Safe to call on every page: it's a no-op without a cookie or session.
export async function POST() {
  const jar = await cookies();
  const raw = jar.get(REF_COOKIE)?.value;
  const code = raw ? normalizeReferralCode(raw) : "";
  if (!code) return NextResponse.json({ ineligible: true });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ pending: true }); // claim after login

  const admin = createAdminClient();

  const { data: me } = await admin
    .from("profiles")
    .select("referred_by, referral_code")
    .eq("id", user.id)
    .maybeSingle();

  // Already attributed, or the customer entered their own code.
  if (!me || me.referred_by || me.referral_code === code) {
    const res = NextResponse.json({ ineligible: true });
    res.cookies.delete(REF_COOKIE);
    return res;
  }

  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  if (!referrer || referrer.id === user.id) {
    const res = NextResponse.json({ ineligible: true });
    res.cookies.delete(REF_COOKIE);
    return res;
  }

  // Attribute only — guard against a race by requiring referred_by still null.
  await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id)
    .is("referred_by", null);

  const res = NextResponse.json({ claimed: true });
  res.cookies.delete(REF_COOKIE);
  return res;
}
