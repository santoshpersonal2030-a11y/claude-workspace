import Link from "next/link";
import { notFound } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import OrderInvoice from "@/components/receipts/OrderInvoice";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Order invoice" };

export default async function AdminOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, invoice_no, status, subtotal, shipping, total_amount, created_at, delivery_name, delivery_phone, address, city, pincode, order_items(id, product_name, quantity, unit_price, line_total)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to order
        </Link>
        <PrintButton />
      </div>
      <OrderInvoice order={order} />
    </div>
  );
}
