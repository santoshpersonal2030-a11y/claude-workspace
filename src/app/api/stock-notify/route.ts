import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type Body = { productSlug?: string; email?: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = (await request.json()) as Body;
  const email = (body.email || user?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@") || !body.productSlug) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", body.productSlug)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { error } = await supabase.from("stock_subscriptions").insert({
    product_id: product.id,
    email,
    user_id: user?.id ?? null,
  });

  // A duplicate (already subscribed) is fine.
  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "Could not save your request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
