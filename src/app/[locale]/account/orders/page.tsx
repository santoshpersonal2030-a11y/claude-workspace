import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderStatusTracker from "@/components/OrderStatusTracker";
import TrackingLink from "@/components/TrackingLink";
import ReorderButton from "@/components/ReorderButton";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Orders" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending payment",
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, tracking_number, estimated_delivery, carrier, order_items(product_name, quantity, products(slug, name, price, image_url, active, stock))",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <h1 className="font-heading text-3xl text-maroon-800">My orders</h1>

          {!orders || orders.length === 0 ? (
            <p className="mt-4 text-foreground/65">
              You haven&apos;t placed any orders yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/65">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-medium text-saffron-700">
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/70">
                    {order.order_items
                      .map((i) => `${i.product_name} ×${i.quantity}`)
                      .join(", ")}
                  </p>
                  <div className="mt-4">
                    <OrderStatusTracker status={order.status} />
                  </div>
                  {(order.tracking_number || order.estimated_delivery) && (
                    <p className="mt-3 text-xs text-foreground/65">
                      {order.tracking_number && (
                        <>
                          Tracking:{" "}
                          <TrackingLink
                            carrier={order.carrier}
                            trackingNumber={order.tracking_number}
                            className="text-xs"
                          />
                        </>
                      )}
                      {order.tracking_number && order.estimated_delivery && " · "}
                      {order.estimated_delivery && (
                        <>Est. delivery: {order.estimated_delivery}</>
                      )}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-saffron-50 pt-3">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
                    >
                      View details →
                    </Link>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const reorderItems = order.order_items
                          .filter(
                            (i) =>
                              i.products?.active &&
                              (i.products?.stock ?? 0) > 0,
                          )
                          .map((i) => ({
                            slug: i.products!.slug,
                            name: i.products!.name,
                            price: i.products!.price,
                            imageUrl: i.products!.image_url,
                            quantity: i.quantity,
                          }));
                        return reorderItems.length > 0 ? (
                          <ReorderButton items={reorderItems} compact />
                        ) : null;
                      })()}
                      <span className="font-semibold text-saffron-700">
                        {formatINR(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
