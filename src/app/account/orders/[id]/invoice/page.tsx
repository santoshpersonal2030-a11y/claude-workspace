import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Invoice" };

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/orders/${id}/invoice`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, subtotal, shipping, total_amount, created_at, delivery_name, delivery_phone, address, city, pincode, order_items(id, product_name, quantity, unit_price, line_total)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/account/orders/${order.id}`}
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to order
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-saffron-100 p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-heading text-xl text-maroon-800">
              🪔 BookMyPoojari
            </div>
            <p className="text-xs text-foreground/55">bookmypoojari.com</p>
          </div>
          <div className="text-right text-sm">
            <div className="font-heading text-lg text-maroon-700">Invoice</div>
            <div className="text-foreground/60">#{order.id.slice(0, 8)}</div>
            <div className="text-foreground/60">
              {new Date(order.created_at).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm">
          <div className="text-foreground/55">Billed to</div>
          <div className="font-medium text-foreground">
            {order.delivery_name ?? "Customer"}
          </div>
          {order.delivery_phone && (
            <div className="text-foreground/70">{order.delivery_phone}</div>
          )}
          {order.address && (
            <div className="text-foreground/70">{order.address}</div>
          )}
          <div className="text-foreground/70">
            {[order.city, order.pincode].filter(Boolean).join(" · ")}
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-saffron-100 text-left text-foreground/55">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((i) => (
              <tr key={i.id} className="border-b border-saffron-50">
                <td className="py-2">{i.product_name}</td>
                <td className="py-2 text-center">{i.quantity}</td>
                <td className="py-2 text-right">{formatINR(i.unit_price)}</td>
                <td className="py-2 text-right">{formatINR(i.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/60">Shipping</span>
            <span>
              {order.shipping === 0 ? "Free" : formatINR(order.shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-saffron-100 pt-1 text-base font-semibold">
            <span>Total</span>
            <span className="text-saffron-700">
              {formatINR(order.total_amount)}
            </span>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-foreground/50">
          Thank you for shopping with BookMyPoojari · Status: {order.status}
        </p>
      </div>
    </main>
  );
}
