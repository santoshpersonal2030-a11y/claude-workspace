import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const PURCHASED_STATUSES = ["paid", "packed", "shipped", "delivered"] as const;

type ReviewBody = {
  productSlug?: string;
  rating?: number;
  title?: string;
  body?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const payload = (await request.json()) as ReviewBody;
  const rating = Math.round(Number(payload.rating));
  if (!payload.productSlug || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "A rating between 1 and 5 is required." },
      { status: 400 },
    );
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", payload.productSlug)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Only verified buyers may review: require a paid order containing this item.
  const { data: purchased } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id, status)")
    .eq("product_id", product.id)
    .eq("orders.user_id", user.id)
    .in("orders.status", PURCHASED_STATUSES)
    .limit(1);

  if (!purchased || purchased.length === 0) {
    return NextResponse.json(
      { error: "Only verified buyers can review this product." },
      { status: 403 },
    );
  }

  // Snapshot a display name so the public review list needs no profile join.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const reviewerName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Devotee";

  const { error } = await supabase.from("product_reviews").upsert(
    {
      product_id: product.id,
      user_id: user.id,
      reviewer_name: reviewerName,
      rating,
      title: payload.title?.trim() || null,
      body: payload.body?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,user_id" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Could not save your review." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
