import Link from "next/link";
import { notFound } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import OrderInvoice from "@/components/receipts/OrderInvoice";
import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceNumber } from "@/lib/invoice";
import { qrDataUrl, invoiceQrPayload } from "@/lib/qr";
import { getCompany } from "@/lib/company-settings";

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
      "id, invoice_no, invoice_fy, status, irn, signed_qr, ewb_no, subtotal, shipping, discount, coupon_code, total_amount, created_at, delivery_name, delivery_phone, address, city, state, pincode, order_items(id, product_name, quantity, unit_price, line_total, gst_rate, hsn_code)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const company = await getCompany();
  const qr = await qrDataUrl(
    order.signed_qr ||
      invoiceQrPayload(
        invoiceNumber(order.invoice_no, order.invoice_fy),
        order.total_amount,
        company.upi,
        company.name,
      ),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-sm text-foreground/65 hover:text-saffron-700"
        >
          ← Back to order
        </Link>
        <div className="flex gap-3">
          <a
            href={`/api/admin/invoice/order/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-saffron-300 px-4 py-2 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
          >
            Download PDF
          </a>
          <PrintButton />
        </div>
      </div>
      <OrderInvoice order={order} qrDataUrl={qr} company={company} />
    </div>
  );
}
