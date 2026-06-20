import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import OrderInvoice from "@/components/receipts/OrderInvoice";
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
      "id, invoice_no, invoice_fy, status, subtotal, shipping, total_amount, created_at, delivery_name, delivery_phone, address, city, state, pincode, order_items(id, product_name, quantity, unit_price, line_total, gst_rate, hsn_code)",
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
      <OrderInvoice order={order} />
    </main>
  );
}
