import Link from "next/link";
import { notFound } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import CreditNote from "@/components/receipts/CreditNote";
import { createAdminClient } from "@/lib/supabase/admin";
import { invoiceNumber } from "@/lib/invoice";
import { qrDataUrl, invoiceQrPayload } from "@/lib/qr";
import { getCompany } from "@/lib/company-settings";

export const metadata = { title: "Credit note" };

export default async function AdminCreditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: note } = await admin
    .from("credit_notes")
    .select(
      "invoice_no, invoice_fy, created_at, amount, reason, order_id, orders(invoice_no, invoice_fy, delivery_name, delivery_phone, address, city, state, pincode)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!note) notFound();

  const company = await getCompany();
  const qr = await qrDataUrl(
    invoiceQrPayload(
      invoiceNumber(note.invoice_no, note.invoice_fy, "CN"),
      note.amount,
      company.upi,
      company.name,
    ),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={note.order_id ? `/admin/orders/${note.order_id}` : "/admin/bookings"}
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to order
        </Link>
        <PrintButton />
      </div>
      <CreditNote note={note} qrDataUrl={qr} company={company} />
    </div>
  );
}
