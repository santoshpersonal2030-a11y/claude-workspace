import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import CreditNote from "@/components/receipts/CreditNote";
import { createClient } from "@/lib/supabase/server";
import { invoiceNumber } from "@/lib/invoice";
import { qrDataUrl, invoiceQrPayload } from "@/lib/qr";
import { getCompany } from "@/lib/company-settings";

export const metadata = { title: "Credit note" };

export default async function CreditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/credit-notes/${id}`);

  const { data: note } = await supabase
    .from("credit_notes")
    .select(
      "invoice_no, invoice_fy, created_at, amount, reason, orders(invoice_no, invoice_fy, delivery_name, delivery_phone, address, city, state, pincode)",
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
    <main className="mx-auto max-w-2xl px-6 py-4">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/account/orders"
          className="text-sm text-foreground/65 hover:text-saffron-700"
        >
          ← Back to orders
        </Link>
        <PrintButton />
      </div>
      <CreditNote note={note} qrDataUrl={qr} company={company} />
    </main>
  );
}
