import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderStatusTracker from "@/components/OrderStatusTracker";
import ProductThumb from "@/components/ProductThumb";
import TrackingLink from "@/components/TrackingLink";
import ReorderButton from "@/components/ReorderButton";
import { invoiceNumber } from "@/lib/invoice";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Order details" };

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/orders/${id}`);

  // RLS ensures the user can only read their own order.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal, shipping, total_amount, created_at, delivery_name, delivery_phone, address, city, pincode, tracking_number, estimated_delivery, carrier, order_items(id, product_name, quantity, unit_price, line_total, products(slug, name, price, image_url, active, stock))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: creditNotes } = await supabase
    .from("credit_notes")
    .select("id, invoice_no, invoice_fy, amount")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  // Items still purchasable, for the Reorder button (uses current price).
  const reorderItems = order.order_items
    .filter((i) => i.products?.active && (i.products?.stock ?? 0) > 0)
    .map((i) => ({
      slug: i.products!.slug,
      name: i.products!.name,
      price: i.products!.price,
      imageUrl: i.products!.image_url,
      quantity: i.quantity,
    }));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link
            href="/account/orders"
            className="text-sm text-foreground/60 hover:text-saffron-700"
          >
            ← All orders
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl text-maroon-800">
                Order details
              </h1>
              <p className="mt-1 text-sm text-foreground/55">
                Placed {formatDate(order.created_at)} · #{order.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/account/orders/${order.id}/invoice`}
                className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
              >
                Invoice
              </Link>
              {reorderItems.length > 0 && (
                <ReorderButton items={reorderItems} />
              )}
            </div>
          </div>

          {/* Tracker */}
          <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
            <OrderStatusTracker status={order.status} />
            {(order.tracking_number || order.estimated_delivery) && (
              <div className="mt-4 border-t border-saffron-50 pt-3 text-sm text-foreground/70">
                {order.tracking_number && (
                  <p>
                    Tracking:{" "}
                    <TrackingLink
                      carrier={order.carrier}
                      trackingNumber={order.tracking_number}
                    />
                  </p>
                )}
                {order.estimated_delivery && (
                  <p>
                    Estimated delivery:{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(order.estimated_delivery)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
            <h2 className="font-heading text-lg text-maroon-700">Items</h2>
            <ul className="mt-4 space-y-4">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <ProductThumb
                    imageUrl={item.products?.image_url ?? null}
                    name={item.product_name}
                    className="h-14 w-14 rounded-xl"
                    emojiSize="text-2xl"
                  />
                  <div className="flex-1">
                    {item.products?.slug ? (
                      <Link
                        href={`/store/${item.products.slug}`}
                        className="text-sm font-medium text-foreground hover:text-saffron-700"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {item.product_name}
                      </span>
                    )}
                    <div className="text-xs text-foreground/55">
                      {formatINR(item.unit_price)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatINR(item.line_total)}
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-1 border-t border-saffron-50 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground/60">Subtotal</dt>
                <dd>{formatINR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground/60">Shipping</dt>
                <dd>
                  {order.shipping === 0 ? "Free" : formatINR(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-saffron-700">
                  {formatINR(order.total_amount)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Credit notes */}
          {creditNotes && creditNotes.length > 0 && (
            <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                Credit notes
              </h2>
              <ul className="mt-3 space-y-1 text-sm">
                {creditNotes.map((cn) => (
                  <li key={cn.id} className="flex justify-between">
                    <Link
                      href={`/account/credit-notes/${cn.id}`}
                      className="font-semibold text-saffron-700 hover:text-saffron-800"
                    >
                      {invoiceNumber(cn.invoice_no, cn.invoice_fy, "CN")}
                    </Link>
                    <span>{formatINR(cn.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delivery address */}
          {(order.delivery_name || order.address) && (
            <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-lg text-maroon-700">
                Delivery address
              </h2>
              <div className="mt-2 text-sm text-foreground/75">
                {order.delivery_name && <div>{order.delivery_name}</div>}
                {order.delivery_phone && <div>{order.delivery_phone}</div>}
                {order.address && <div>{order.address}</div>}
                <div>
                  {[order.city, order.pincode].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
