import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/poojas";

async function count(table: "bookings" | "orders" | "products" | "poojas") {
  const admin = createAdminClient();
  const { count } = await admin
    .from(table)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

const PAID_ORDER_STATUSES = [
  "paid",
  "packed",
  "shipped",
  "delivered",
] as const;
const ACTIVE_BOOKING_STATUSES = [
  "confirmed",
  "assigned",
  "completed",
] as const;

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    bookings,
    orders,
    products,
    poojas,
    recentBookings,
    recentOrders,
    paidOrders,
    activeBookings,
    payments,
  ] = await Promise.all([
    count("bookings"),
    count("orders"),
    count("products"),
    count("poojas"),
    admin
      .from("bookings")
      .select("id, status, total_amount, created_at, poojas(name)")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("orders")
      .select("id, status, total_amount, created_at, delivery_name")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("orders")
      .select("status, total_amount, order_items(product_name, quantity)")
      .in("status", PAID_ORDER_STATUSES),
    admin
      .from("bookings")
      .select("total_amount")
      .in("status", ACTIVE_BOOKING_STATUSES),
    admin.from("payments").select("refunded_amount"),
  ]);

  // Revenue, refunds, fulfilment queue.
  const storeRevenue = (paidOrders.data ?? []).reduce(
    (s, o) => s + o.total_amount,
    0,
  );
  const bookingRevenue = (activeBookings.data ?? []).reduce(
    (s, b) => s + b.total_amount,
    0,
  );
  const refundsTotal = (payments.data ?? []).reduce(
    (s, p) => s + p.refunded_amount,
    0,
  );
  const pendingFulfilment = (paidOrders.data ?? []).filter(
    (o) => o.status === "paid" || o.status === "packed",
  ).length;

  // Top products by units sold.
  const unitsByProduct = new Map<string, number>();
  for (const o of paidOrders.data ?? []) {
    for (const item of o.order_items) {
      unitsByProduct.set(
        item.product_name,
        (unitsByProduct.get(item.product_name) ?? 0) + item.quantity,
      );
    }
  }
  const topProducts = [...unitsByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stats = [
    { label: "Bookings", value: bookings, href: "/admin/bookings" },
    { label: "Orders", value: orders, href: "/admin/bookings" },
    { label: "Products", value: products, href: "/admin/products" },
    { label: "Poojas", value: poojas, href: "/admin/poojas" },
  ];

  const metrics = [
    { label: "Store revenue", value: formatINR(storeRevenue) },
    { label: "Booking revenue", value: formatINR(bookingRevenue) },
    { label: "Refunds", value: formatINR(refundsTotal) },
    { label: "Pending fulfilment", value: String(pendingFulfilment) },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-colors hover:border-saffron-300"
          >
            <div className="text-3xl font-heading text-saffron-700">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-foreground/60">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Revenue & fulfilment metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-saffron-100 bg-gradient-to-br from-saffron-50 to-white p-5 shadow-sm"
          >
            <div className="font-heading text-2xl text-maroon-800">
              {m.value}
            </div>
            <div className="mt-1 text-sm text-foreground/60">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg text-maroon-700">
          Top products (units sold)
        </h2>
        {topProducts.length ? (
          <ul className="mt-3 divide-y divide-saffron-50 text-sm">
            {topProducts.map(([name, qty]) => (
              <li key={name} className="flex justify-between py-2">
                <span className="text-foreground/75">{name}</span>
                <span className="font-medium text-saffron-700">{qty}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-foreground/50">No sales yet.</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg text-maroon-700">
            Recent bookings
          </h2>
          <ul className="mt-3 divide-y divide-saffron-50 text-sm">
            {recentBookings.data?.length ? (
              recentBookings.data.map((b) => (
                <li key={b.id} className="flex justify-between py-2">
                  <span className="text-foreground/75">
                    {b.poojas?.name ?? "Pooja"}
                  </span>
                  <span className="text-foreground/50">
                    {b.status} · {formatINR(b.total_amount)}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-foreground/50">No bookings yet.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg text-maroon-700">
            Recent orders
          </h2>
          <ul className="mt-3 divide-y divide-saffron-50 text-sm">
            {recentOrders.data?.length ? (
              recentOrders.data.map((o) => (
                <li key={o.id} className="flex justify-between py-2">
                  <span className="text-foreground/75">
                    {o.delivery_name ?? "Customer"}
                  </span>
                  <span className="text-foreground/50">
                    {o.status} · {formatINR(o.total_amount)}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-foreground/50">No orders yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
