import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBookingReceiptPdf } from "@/lib/invoice-pdf";
import { getLogoJpeg } from "@/lib/logo";
import { invoiceNumber } from "@/lib/invoice";

const FIELDS =
  "id, invoice_no, invoice_fy, status, booking_date, time_slot, language, address, city, pincode, samagri_kit, service_price, samagri_price, total_amount, created_at, poojas(name)";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = buildBookingReceiptPdf(booking, await getLogoJpeg());
  const name = invoiceNumber(
    booking.invoice_no,
    booking.invoice_fy,
    "BKG",
  ).replace(/\//g, "-");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
    },
  });
}
