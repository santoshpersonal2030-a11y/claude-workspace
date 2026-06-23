import { createAdminClient } from "@/lib/supabase/admin";
import {
  monthlyRevenue,
  funnel,
  rate,
  averageValue,
  countByStatus,
  type DatedAmount,
} from "@/lib/sales-analytics";
import { formatINR } from "@/lib/poojas";

export const metadata = { title: "Analytics — Admin" };

const PAID_ORDER = ["paid", "packed", "shipped", "delivered"];
const ACTIVE_BOOKING = ["confirmed", "assigned", "completed"];

function pctLabel(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

const MONTH_LABEL = (m: string) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
};

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient();
  const [orders, bookings] = await Promise.all([
    admin.from("orders").select("status, total_amount, created_at"),
    admin.from("bookings").select("status, total_amount, created_at"),
  ]);

  const orderRows = orders.data ?? [];
  const bookingRows = bookings.data ?? [];

  const paidOrders = orderRows.filter((o) => PAID_ORDER.includes(o.status));
  const activeBookings = bookingRows.filter((b) =>
    ACTIVE_BOOKING.includes(b.status),
  );

  const toDated = (r: { created_at: string; total_amount: number }): DatedAmount => ({
    createdAt: r.created_at,
    amount: r.total_amount,
  });

  const trend = monthlyRevenue(
    paidOrders.map(toDated),
    activeBookings.map(toDated),
  ).slice(-12);
  const maxMonth = Math.max(1, ...trend.map((t) => t.total));

  const oStatus = countByStatus(orderRows.map((o) => o.status));
  const bStatus = countByStatus(bookingRows.map((b) => b.status));

  const ordersPaid = paidOrders.length;
  const orderFunnel = funnel([
    { label: "Orders placed", count: orderRows.length },
    { label: "Paid", count: ordersPaid },
    { label: "Fulfilled", count: oStatus.delivered ?? 0 },
  ]);
  const bookingFunnel = funnel([
    { label: "Requested", count: bookingRows.length },
    { label: "Confirmed", count: activeBookings.length },
    { label: "Pandit assigned", count: (bStatus.assigned ?? 0) + (bStatus.completed ?? 0) },
    { label: "Completed", count: bStatus.completed ?? 0 },
  ]);

  const cards = [
    {
      label: "Total revenue",
      value: formatINR(
        paidOrders.reduce((s, o) => s + o.total_amount, 0) +
          activeBookings.reduce((s, b) => s + b.total_amount, 0),
      ),
    },
    {
      label: "Order conversion",
      value: pctLabel(rate(ordersPaid, orderRows.length)),
      sub: `${ordersPaid}/${orderRows.length} paid`,
    },
    {
      label: "Booking completion",
      value: pctLabel(rate(bStatus.completed ?? 0, bookingRows.length)),
      sub: `${bStatus.completed ?? 0}/${bookingRows.length} completed`,
    },
    {
      label: "Avg. order value",
      value: formatINR(averageValue(paidOrders.map(toDated))),
      sub: `booking ${formatINR(averageValue(activeBookings.map(toDated)))}`,
    },
  ];

  const orderCancelRate = rate(oStatus.cancelled ?? 0, orderRows.length);
  const bookingCancelRate = rate(bStatus.cancelled ?? 0, bookingRows.length);

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Analytics</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Revenue trend, conversion and the booking/order funnels across all time.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-saffron-100 bg-gradient-to-br from-saffron-50 to-white p-5 shadow-sm"
          >
            <div className="font-heading text-2xl text-maroon-800">
              {c.value}
            </div>
            <div className="mt-1 text-sm text-foreground/60">{c.label}</div>
            {c.sub && (
              <div className="text-xs text-foreground/45">{c.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Monthly revenue trend */}
      <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg text-maroon-700">
          Revenue — last 12 months
        </h2>
        {trend.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">No revenue yet.</p>
        ) : (
          <div className="mt-4 flex items-end gap-2" style={{ height: 160 }}>
            {trend.map((t) => (
              <div
                key={t.month}
                className="flex flex-1 flex-col items-center justify-end gap-1"
                title={`${MONTH_LABEL(t.month)}: ${formatINR(t.total)}`}
              >
                <div className="flex w-full flex-col justify-end overflow-hidden rounded-t bg-saffron-100" style={{ height: `${(t.total / maxMonth) * 130}px` }}>
                  <div
                    className="w-full bg-saffron-500"
                    style={{
                      height: `${t.total === 0 ? 0 : (t.store / t.total) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-foreground/50">
                  {MONTH_LABEL(t.month)}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-foreground/50">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-saffron-500" />
          Store
          <span className="ml-3 mr-1 inline-block h-2 w-2 rounded-full bg-saffron-100" />
          Bookings
        </p>
      </div>

      {/* Funnels */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FunnelCard
          title="Order funnel"
          stages={orderFunnel}
          footer={`Cancellation rate ${pctLabel(orderCancelRate)}`}
        />
        <FunnelCard
          title="Booking funnel"
          stages={bookingFunnel}
          footer={`Cancellation rate ${pctLabel(bookingCancelRate)}`}
        />
      </div>
    </div>
  );
}

function FunnelCard({
  title,
  stages,
  footer,
}: {
  title: string;
  stages: { label: string; count: number; pct: number }[];
  footer: string;
}) {
  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg text-maroon-700">{title}</h2>
      <div className="mt-4 space-y-2">
        {stages.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">{s.label}</span>
              <span className="font-medium text-maroon-700">
                {s.count}{" "}
                <span className="text-xs text-foreground/40">({s.pct}%)</span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-saffron-50">
              <div
                className="h-full rounded-full bg-saffron-500"
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-foreground/50">{footer}</p>
    </div>
  );
}
