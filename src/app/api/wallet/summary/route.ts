import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getAvailableBalance, getRewardSettings } from "@/lib/wallet";

// The signed-in customer's spendable store credit + the redemption cap, for
// the cart/checkout UI. Balance is computed server-side (service role) so it
// can't be tampered with; the actual redemption is re-validated at checkout.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ available: 0, maxRedeemPct: 0, rewardsEnabled: false });
  }
  const [available, settings] = await Promise.all([
    getAvailableBalance(user.id),
    getRewardSettings(),
  ]);
  return NextResponse.json({
    available: settings.rewardsEnabled ? available : 0,
    maxRedeemPct: settings.maxRedeemPct,
    rewardsEnabled: settings.rewardsEnabled,
  });
}
