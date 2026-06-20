import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import CreditNote from "@/components/receipts/CreditNote";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/account/orders"
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to orders
        </Link>
        <PrintButton />
      </div>
      <CreditNote note={note} />
    </main>
  );
}
