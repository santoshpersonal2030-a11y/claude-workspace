import Link from "next/link";
import { notFound } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import BookingReceipt from "@/components/receipts/BookingReceipt";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Booking receipt" };

export default async function AdminBookingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, invoice_no, status, booking_date, time_slot, language, address, city, pincode, samagri_kit, service_price, samagri_price, total_amount, created_at, poojas(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to booking
        </Link>
        <PrintButton />
      </div>
      <BookingReceipt booking={booking} />
    </div>
  );
}
