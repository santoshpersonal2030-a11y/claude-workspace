// SERVER-ONLY: e-way bill generation via an EWB/GSP endpoint. Scaffold: builds
// the payload and posts it when EWB_* env vars are set, otherwise reports that
// it isn't configured. E-way bills are required for consignments over a
// threshold (default ₹50,000).

import { createAdminClient } from "@/lib/supabase/admin";
import { COMPANY } from "@/lib/company";
import { STATE_CODES } from "@/lib/india";
import { invoiceNumber } from "@/lib/invoice";

export const EWB_THRESHOLD = Number(process.env.EWB_THRESHOLD ?? 50000);

export function ewaybillConfigured(): boolean {
  return Boolean(process.env.EWB_API_URL && process.env.EWB_AUTH_TOKEN);
}

type OrderRow = {
  id: string;
  invoice_no: number | null;
  invoice_fy: number | null;
  created_at: string;
  customer_gstin: string | null;
  delivery_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  total_amount: number;
  order_items: {
    product_name: string;
    quantity: number;
    line_total: number;
    gst_rate: number;
    hsn_code: string | null;
  }[];
};

function buildPayload(order: OrderRow) {
  const sellerCode = STATE_CODES[COMPANY.state] ?? "";
  const buyerCode = order.state ? (STATE_CODES[order.state] ?? "") : "";
  return {
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo: invoiceNumber(order.invoice_no, order.invoice_fy),
    docDate: new Date(order.created_at).toLocaleDateString("en-GB"),
    fromGstin: COMPANY.gstin,
    fromStateCode: sellerCode,
    toGstin: order.customer_gstin ?? "URP",
    toTrdName: order.delivery_name ?? "",
    toStateCode: buyerCode,
    toPincode: order.pincode ?? "",
    totInvValue: order.total_amount,
    itemList: order.order_items.map((i) => ({
      productName: i.product_name,
      hsnCode: i.hsn_code ?? "",
      quantity: i.quantity,
      taxableAmount: Math.round(
        i.line_total / (1 + (Number(i.gst_rate) || 0) / 100),
      ),
      gstRate: Number(i.gst_rate) || 0,
    })),
  };
}

export async function generateEwayBill(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, invoice_no, invoice_fy, created_at, customer_gstin, delivery_name, address, city, state, pincode, total_amount, ewb_no, order_items(product_name, quantity, line_total, gst_rate, hsn_code)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false, error: "Order not found" };
  if (order.ewb_no) return { ok: true };
  if (order.total_amount < EWB_THRESHOLD) {
    return { ok: false, error: "Below e-way bill threshold" };
  }
  if (!ewaybillConfigured()) {
    return { ok: false, error: "E-way bill API is not configured" };
  }

  try {
    const res = await fetch(process.env.EWB_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EWB_AUTH_TOKEN}`,
      },
      body: JSON.stringify(buildPayload(order as OrderRow)),
    });
    if (!res.ok) return { ok: false, error: `EWB API error ${res.status}` };
    const data = (await res.json()) as { ewayBillNo?: string | number };
    if (!data.ewayBillNo) return { ok: false, error: "No EWB number returned" };

    await admin
      .from("orders")
      .update({
        ewb_no: String(data.ewayBillNo),
        ewb_date: new Date().toISOString(),
      })
      .eq("id", orderId);
    return { ok: true };
  } catch (err) {
    console.error("generateEwayBill failed:", err);
    return { ok: false, error: "EWB request failed" };
  }
}
