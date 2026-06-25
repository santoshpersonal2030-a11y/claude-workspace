import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildGstr3b } from "@/lib/exports";
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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const admin = createAdminClient();

  // Apply the date range (if any) to the revenue/fulfilment queries.
  let paidOrdersQuery = admin
    .from("orders")
    .select("status, total_amount, created_at, order_items(product_name, quantity)")
    .in("status", PAID_ORDER_STATUSES);
  let activeBookingsQuery = admin
    .from("bookings")
    .select("total_amount, created_at")
    .in("status", ACTIVE_BOOKING_STATUSES);
  let paymentsQuery = admin.from("payments").select("refunded_amount, created_at");

  if (from) {
    paidOrdersQuery = paidOrdersQuery.gte("created_at", from);
    activeBookingsQuery = activeBookingsQuery.gte("created_at", from);
    paymentsQuery = paymentsQuery.gte("created_at", from);
  }
  if (to) {
    const end = `${to}T23:59:59`;
    paidOrdersQuery = paidOrdersQuery.lte("created_at", end);
    activeBookingsQuery = activeBookingsQuery.lte("created_at", end);
    paymentsQuery = paymentsQuery.lte("created_at", end);
  }

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
    lowStockRes,
    stockSubs,
    allPaidOrders,
    allActiveBookings,
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
    paidOrdersQuery,
    activeBookingsQuery,
    paymentsQuery,
    admin
      .from("products")
      .select("id, name, slug, stock")
      .eq("active", true)
      .lte("stock", 5)
      .order("stock", { ascending: true }),
    admin
      .from("stock_subscriptions")
      .select("product_id")
      .is("notified_at", null),
    admin
      .from("orders")
      .select("total_amount, created_at")
      .in("status", PAID_ORDER_STATUSES),
    admin
      .from("bookings")
      .select("total_amount, created_at")
      .in("status", ACTIVE_BOOKING_STATUSES),
  ]);

  // Revenue grouped by financial year (FY starts 1 April).
  const fyOf = (d: string) => {
    const dt = new Date(d);
    return dt.getMonth() + 1 >= 4 ? dt.getFullYear() : dt.getFullYear() - 1;
  };
  const fyMap = new Map<number, { store: number; booking: number }>();
  for (const o of allPaidOrders.data ?? []) {
    const e = fyMap.get(fyOf(o.created_at)) ?? { store: 0, booking: 0 };
    e.store += o.total_amount;
    fyMap.set(fyOf(o.created_at), e);
  }
  for (const b of allActiveBookings.data ?? []) {
    const e = fyMap.get(fyOf(b.created_at)) ?? { store: 0, booking: 0 };
    e.booking += b.total_amount;
    fyMap.set(fyOf(b.created_at), e);
  }
  const fyRows = [...fyMap.entries()].sort((a, b) => b[0] - a[0]);

  const gstr3b = await buildGstr3b(from, to);

  const lowStock = lowStockRes.data ?? [];
  const waiting = new Map<string, number>();
  for (const s of stockSubs.data ?? []) {
    waiting.set(s.product_id, (waiting.get(s.product_id) ?? 0) + 1);
  }

  // Date-range presets.
  const today = new Date();
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 7);
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 30);
  const presets = [
    { label: "All time", href: "/admin" },
    {
      label: "Last 7 days",
      href: `/admin?from=${isoDate(last7)}&to=${isoDate(today)}`,
    },
    {
      label: "Last 30 days",
      href: `/admin?from=${isoDate(last30)}&to=${isoDate(today)}`,
    },
  ];

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

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm transition-colors hover:border-saffron-300"
          >
            <div className="text-3xl font-heading text-saffron-700">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-foreground/65">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Date range filter */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground/70">
          Metrics for:
        </span>
        {presets.map((p) => (
          <Link
            key={p.label}
            href={p.href}
            className="rounded-full border border-saffron-200 bg-white px-3 py-1 text-xs font-medium text-saffron-700 hover:bg-saffron-50"
          >
            {p.label}
          </Link>
        ))}
        <form action="/admin" className="flex items-center gap-2 text-xs">
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="rounded-lg border border-saffron-200 bg-cream px-2 py-1"
          />
          <span className="text-foreground/65">→</span>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="rounded-lg border border-saffron-200 bg-cream px-2 py-1"
          />
          <button
            type="submit"
            className="rounded-full bg-saffron-700 px-3 py-1 font-semibold text-white hover:bg-saffron-800"
          >
            Apply
          </button>
        </form>
        <a
          href={`/api/admin/export/gstr1${
            from || to ? `?from=${from ?? ""}&to=${to ?? ""}` : ""
          }`}
          className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
        >
          ⬇ GSTR-1 CSV
        </a>
        <a
          href={`/api/admin/export/gstr1-json${
            from || to ? `?from=${from ?? ""}&to=${to ?? ""}` : ""
          }`}
          className="rounded-full border border-saffron-300 px-3 py-1 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
        >
          ⬇ GSTR-1 JSON
        </a>
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
            <div className="mt-1 text-sm text-foreground/65">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
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
          <p className="mt-3 text-sm text-foreground/65">No sales yet.</p>
        )}
      </div>

      {/* Low stock / reorder suggestions */}
      <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-maroon-700">
            Low stock — reorder soon
          </h2>
          <Link
            href="/admin/products"
            className="text-sm font-semibold text-saffron-700 hover:text-saffron-800"
          >
            Manage →
          </Link>
        </div>
        {lowStock.length ? (
          <ul className="mt-3 divide-y divide-saffron-50 text-sm">
            {lowStock.map((p) => {
              const demand = waiting.get(p.id) ?? 0;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2"
                >
                  <Link
                    href={`/store/${p.slug}`}
                    className="text-foreground/75 hover:text-saffron-700"
                  >
                    {p.name}
                  </Link>
                  <span className="flex items-center gap-3">
                    {demand > 0 && (
                      <span className="text-xs text-maroon-700">
                        🔔 {demand} waiting
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.stock <= 0
                          ? "bg-maroon-50 text-maroon-700"
                          : "bg-saffron-50 text-saffron-700"
                      }`}
                    >
                      {p.stock <= 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-foreground/65">
            All products are well stocked. 🎉
          </p>
        )}
      </div>

      {/* GSTR-3B 3.1 (tax payable) */}
      <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-maroon-700">
            GSTR-3B 3.1 — tax payable
          </h2>
          <a
            href={`/api/admin/export/gstr3b${
              from || to ? `?from=${from ?? ""}&to=${to ?? ""}` : ""
            }`}
            className="text-xs font-semibold text-saffron-700 hover:text-saffron-800"
          >
            JSON →
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Taxable", value: gstr3b.taxable },
            { label: "IGST", value: gstr3b.igst },
            { label: "CGST", value: gstr3b.cgst },
            { label: "SGST", value: gstr3b.sgst },
            { label: "Cess", value: gstr3b.cess },
            { label: "Exempt", value: gstr3b.exempt },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-saffron-50 p-3">
              <div className="text-xs text-foreground/65">{c.label}</div>
              <div className="font-medium text-maroon-700">
                {formatINR(c.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue by financial year */}
      <div className="mt-4 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg text-maroon-700">
          Revenue by financial year
        </h2>
        {fyRows.length ? (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-saffron-50 text-left text-foreground/65">
                <th scope="col" className="py-2">FY</th>
                <th scope="col" className="py-2 text-right">Store</th>
                <th scope="col" className="py-2 text-right">Bookings</th>
                <th scope="col" className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {fyRows.map(([fy, v]) => (
                <tr key={fy} className="border-b border-saffron-50">
                  <td className="py-2">
                    {fy}–{String((fy + 1) % 100).padStart(2, "0")}
                  </td>
                  <td className="py-2 text-right">{formatINR(v.store)}</td>
                  <td className="py-2 text-right">{formatINR(v.booking)}</td>
                  <td className="py-2 text-right font-semibold text-saffron-700">
                    {formatINR(v.store + v.booking)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-3 text-sm text-foreground/65">No revenue yet.</p>
        )}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
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
                  <span className="text-foreground/65">
                    {b.status} · {formatINR(b.total_amount)}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-foreground/65">No bookings yet.</li>
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
                  <span className="text-foreground/65">
                    {o.status} · {formatINR(o.total_amount)}
                  </span>
                </li>
              ))
            ) : (
              <li className="py-2 text-foreground/65">No orders yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
