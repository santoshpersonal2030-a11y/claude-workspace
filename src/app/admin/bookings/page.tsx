import { createAdminClient } from "@/lib/supabase/admin";
import {
  assignPandit,
  updateBookingStatus,
  updateOrderStatus,
} from "@/app/admin/actions";
import { Constants } from "@/lib/database.types";
import { formatINR } from "@/lib/poojas";

const selectClass =
  "rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBookingsPage() {
  const admin = createAdminClient();
  const [bookings, orders, roster] = await Promise.all([
    admin
      .from("bookings")
      // Two FKs point at pandits, so disambiguate with explicit constraint hints.
      .select(
        "id, booking_date, time_slot, status, total_amount, city, pandit_id, poojas(name), preferred:pandits!bookings_preferred_pandit_id_fkey(full_name), assigned:pandits!bookings_pandit_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select(
        "id, status, total_amount, created_at, delivery_name, delivery_phone, tracking_number, estimated_delivery, order_items(product_name, quantity)",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("pandits")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name", { ascending: true }),
  ]);

  const pandits = roster.data ?? [];

  const bookingStatuses = Constants.public.Enums.booking_status;
  const orderStatuses = Constants.public.Enums.order_status;

  return (
    <div className="space-y-10">
      {/* Bookings */}
      <section>
        <h1 className="font-heading text-2xl text-maroon-800">Bookings</h1>
        <div className="mt-4 space-y-3">
          {bookings.data?.length ? (
            bookings.data.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-saffron-100 bg-white p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-48 flex-1">
                    <div className="font-medium text-maroon-700">
                      {b.poojas?.name ?? "Pooja"}
                    </div>
                    <div className="text-xs text-foreground/55">
                      {formatDate(b.booking_date)} · {b.time_slot}
                      {b.city ? ` · ${b.city}` : ""}
                      {b.preferred?.full_name
                        ? ` · prefers ${b.preferred.full_name}`
                        : ""}
                      {b.assigned?.full_name
                        ? ` · assigned ${b.assigned.full_name}`
                        : ""}
                    </div>
                  </div>
                  <div className="font-medium text-saffron-700">
                    {formatINR(b.total_amount)}
                  </div>
                  <form action={updateBookingStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={b.id} />
                    <select
                      name="status"
                      defaultValue={b.status}
                      className={selectClass}
                    >
                      {bookingStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-saffron-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-700"
                    >
                      Update
                    </button>
                  </form>
                </div>

                {/* Assign the actual pandit */}
                <form
                  action={assignPandit}
                  className="mt-2 flex items-center gap-2 border-t border-saffron-50 pt-2"
                >
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="current_status" value={b.status} />
                  <span className="text-xs font-medium text-foreground/50">
                    Assign Pandit
                  </span>
                  <select
                    name="pandit_id"
                    defaultValue={b.pandit_id ?? ""}
                    className={selectClass}
                  >
                    <option value="">— Unassigned —</option>
                    {pandits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full border border-saffron-300 px-4 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-50"
                  >
                    Assign
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/55">No bookings yet.</p>
          )}
        </div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="font-heading text-2xl text-maroon-800">Orders</h2>
        <div className="mt-4 space-y-3">
          {orders.data?.length ? (
            orders.data.map((o) => (
              <form
                key={o.id}
                action={updateOrderStatus}
                className="rounded-xl border border-saffron-100 bg-white p-3 shadow-sm"
              >
                <input type="hidden" name="id" value={o.id} />
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-48 flex-1">
                    <div className="font-medium text-maroon-700">
                      {o.delivery_name ?? "Customer"}
                      {o.delivery_phone ? (
                        <span className="ml-2 text-xs text-foreground/50">
                          {o.delivery_phone}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-foreground/55">
                      {formatDate(o.created_at)} ·{" "}
                      {o.order_items
                        .map((i) => `${i.product_name} ×${i.quantity}`)
                        .join(", ")}
                    </div>
                  </div>
                  <div className="font-medium text-saffron-700">
                    {formatINR(o.total_amount)}
                  </div>
                  <select
                    name="status"
                    defaultValue={o.status}
                    className={selectClass}
                  >
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-full bg-saffron-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-700"
                  >
                    Update
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-saffron-50 pt-2 text-xs text-foreground/55">
                  <span>Tracking</span>
                  <input
                    name="tracking_number"
                    defaultValue={o.tracking_number ?? ""}
                    placeholder="e.g. 1Z…"
                    className={selectClass}
                  />
                  <span>ETA</span>
                  <input
                    name="estimated_delivery"
                    type="date"
                    defaultValue={o.estimated_delivery ?? ""}
                    className={selectClass}
                  />
                </div>
              </form>
            ))
          ) : (
            <p className="text-sm text-foreground/55">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
