import Link from "next/link";
import { notFound } from "next/navigation";

import {
  updateOrderStatus,
  updateOrderItem,
  removeOrderItem,
  refundOrder,
} from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { Constants } from "@/lib/database.types";
import { CARRIERS } from "@/lib/carriers";
import { razorpayConfigured } from "@/lib/razorpay";
import { formatINR } from "@/lib/poojas";

const inputClass =
  "rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, status, subtotal, shipping, total_amount, created_at, delivery_name, delivery_phone, address, city, pincode, tracking_number, estimated_delivery, carrier, order_items(id, product_name, quantity, unit_price, line_total)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: payment } = await admin
    .from("payments")
    .select("amount, refunded_amount, status, razorpay_payment_id")
    .eq("order_id", order.id)
    .eq("payment_for", "order")
    .maybeSingle();

  const remaining = payment
    ? payment.amount - payment.refunded_amount
    : 0;

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="text-sm text-foreground/60 hover:text-saffron-700"
      >
        ← Bookings & orders
      </Link>
      <h1 className="mt-2 font-heading text-2xl text-maroon-800">
        Order #{order.id.slice(0, 8)}
      </h1>
      <p className="mt-1 text-sm text-foreground/55">
        {new Date(order.created_at).toLocaleString("en-IN")} · {order.status}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Items */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg text-maroon-700">Items</h2>
          <div className="mt-4 space-y-3">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 border-b border-saffron-50 pb-3"
              >
                <div className="min-w-40 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {item.product_name}
                  </div>
                  <div className="text-xs text-foreground/55">
                    {formatINR(item.unit_price)} each ·{" "}
                    {formatINR(item.line_total)}
                  </div>
                </div>
                <form action={updateOrderItem} className="flex items-center gap-2">
                  <input type="hidden" name="item_id" value={item.id} />
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={item.quantity}
                    className={`${inputClass} w-16`}
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-saffron-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-saffron-700"
                  >
                    Save
                  </button>
                </form>
                <form action={removeOrderItem}>
                  <input type="hidden" name="item_id" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-saffron-200 px-3 py-1.5 text-xs font-semibold text-maroon-700 hover:bg-maroon-50"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
            {order.order_items.length === 0 && (
              <p className="text-sm text-foreground/55">No items.</p>
            )}
          </div>

          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">Subtotal</dt>
              <dd>{formatINR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Shipping</dt>
              <dd>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-saffron-700">
                {formatINR(order.total_amount)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Customer + fulfilment */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
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

          <form
            action={updateOrderStatus}
            className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
          >
            <input type="hidden" name="id" value={order.id} />
            <h2 className="font-heading text-lg text-maroon-700">Fulfilment</h2>
            <div className="mt-3 space-y-2">
              <select
                name="status"
                defaultValue={order.status}
                className={`${inputClass} w-full`}
              >
                {Constants.public.Enums.order_status.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                name="carrier"
                defaultValue={order.carrier ?? ""}
                className={`${inputClass} w-full`}
              >
                <option value="">Carrier…</option>
                {CARRIERS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                name="tracking_number"
                defaultValue={order.tracking_number ?? ""}
                placeholder="Tracking number"
                className={`${inputClass} w-full`}
              />
              <input
                name="estimated_delivery"
                type="date"
                defaultValue={order.estimated_delivery ?? ""}
                className={`${inputClass} w-full`}
              />
              <button
                type="submit"
                className="w-full rounded-full bg-saffron-600 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
              >
                Update order
              </button>
            </div>
          </form>

          {/* Refunds */}
          <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
            <h2 className="font-heading text-lg text-maroon-700">Refund</h2>
            {payment?.refunded_amount ? (
              <p className="mt-2 text-sm text-foreground/70">
                Refunded so far:{" "}
                <span className="font-medium">
                  {formatINR(payment.refunded_amount)}
                </span>{" "}
                · remaining {formatINR(remaining)}
              </p>
            ) : null}

            {!payment?.razorpay_payment_id ? (
              <p className="mt-2 text-sm text-foreground/55">
                No captured online payment to refund.
              </p>
            ) : !razorpayConfigured() ? (
              <p className="mt-2 text-sm text-foreground/55">
                Razorpay isn&apos;t configured, so refunds can&apos;t be
                processed yet.
              </p>
            ) : remaining <= 0 ? (
              <p className="mt-2 text-sm text-foreground/55">
                This payment is fully refunded.
              </p>
            ) : (
              <form action={refundOrder} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={order.id} />
                <input
                  name="amount"
                  type="number"
                  min={1}
                  max={remaining}
                  placeholder={`Amount ₹ (blank = full ${formatINR(remaining)})`}
                  className={`${inputClass} w-full`}
                />
                <button
                  type="submit"
                  className="w-full rounded-full border border-maroon-300 py-2 text-sm font-semibold text-maroon-700 hover:bg-maroon-50"
                >
                  Issue refund
                </button>
                <p className="text-[11px] text-foreground/50">
                  A full refund also cancels the order.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
