import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buildOrderInvoicePdf } from "@/lib/invoice-pdf";
import { getLogoJpeg } from "@/lib/logo";
import { invoiceNumber } from "@/lib/invoice";

const FIELDS =
  "id, invoice_no, invoice_fy, status, created_at, total_amount, subtotal, shipping, delivery_name, delivery_phone, address, city, state, pincode, irn, ewb_no, order_items(id, product_name, quantity, unit_price, line_total, gst_rate, hsn_code)";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS limits this to the user's own order.
  const { data: order } = await supabase
    .from("orders")
    .select(FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = buildOrderInvoicePdf(order, await getLogoJpeg());
  const name = invoiceNumber(order.invoice_no, order.invoice_fy).replace(
    /\//g,
    "-",
  );
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}.pdf"`,
    },
  });
}
