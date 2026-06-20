import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createRazorpayOrder,
  razorpayConfigured,
} from "@/lib/razorpay";

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 49;

type CheckoutBody = {
  items: { slug: string; quantity: number }[];
  delivery: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
  };
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as CheckoutBody;
  if (!body.items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Trust the DB for prices. Fetch every product in the cart in one query.
  const slugs = body.items.map((i) => i.slug);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug, name, price, active, gst_rate, hsn_code")
    .in("slug", slugs);

  if (productsError || !products) {
    return NextResponse.json({ error: "Could not load cart" }, { status: 500 });
  }

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Reject the whole cart if any item is unknown or inactive.
  const unavailable = body.items.some((item) => {
    const product = bySlug.get(item.slug);
    return !product || !product.active;
  });
  if (unavailable) {
    return NextResponse.json(
      { error: "One or more items are unavailable" },
      { status: 400 },
    );
  }

  let subtotal = 0;
  const lineItems = body.items.map((item) => {
    const product = bySlug.get(item.slug)!;
    const quantity = Math.max(1, Math.floor(item.quantity));
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity,
      line_total: lineTotal,
      gst_rate: product.gst_rate,
      hsn_code: product.hsn_code,
    };
  });

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      subtotal,
      shipping,
      total_amount: total,
      delivery_name: body.delivery?.name ?? null,
      delivery_phone: body.delivery?.phone ?? null,
      address: body.delivery?.address ?? null,
      city: body.delivery?.city ?? null,
      state: body.delivery?.state ?? null,
      pincode: body.delivery?.pincode ?? null,
      customer_gstin: body.delivery?.gstin?.trim() || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Could not create order" },
      { status: 500 },
    );
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json(
      { error: "Could not save order items" },
      { status: 500 },
    );
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ orderId: order.id, razorpay: null });
  }

  const rzpOrder = await createRazorpayOrder({
    amountInPaise: total * 100,
    receipt: `order_${order.id}`,
    notes: { type: "order", order_id: order.id },
  });

  await supabase.from("payments").insert({
    user_id: user.id,
    payment_for: "order",
    order_id: order.id,
    amount: total,
    currency: "INR",
    razorpay_order_id: rzpOrder.id,
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    razorpay: {
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  });
}
