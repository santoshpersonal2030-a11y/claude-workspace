import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildOrderInvoicePdf } from "@/lib/invoice-pdf";
import { invoiceNumber } from "@/lib/invoice";

const FIELDS =
  "id, invoice_no, invoice_fy, status, created_at, total_amount, subtotal, shipping, delivery_name, delivery_phone, address, city, state, pincode, order_items(id, product_name, quantity, unit_price, line_total, gst_rate, hsn_code)";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdf = buildOrderInvoicePdf(order);
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
