import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import BookingReceipt from "@/components/receipts/BookingReceipt";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Booking receipt" };

export default async function BookingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/bookings/${id}/invoice`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, invoice_no, invoice_fy, status, booking_date, time_slot, language, address, city, pincode, samagri_kit, service_price, samagri_price, total_amount, created_at, poojas(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/account/bookings/${booking.id}`}
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to booking
        </Link>
        <PrintButton />
      </div>
      <BookingReceipt booking={booking} />
    </main>
  );
}
