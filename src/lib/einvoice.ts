// SERVER-ONLY: e-invoice (IRN) generation via an IRP/GSP endpoint. This is a
// forward-looking scaffold: it builds a standard e-invoice payload and posts it
// when EINVOICE_* env vars are configured, otherwise it's a safe no-op.

import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/lib/company";
import { getCompany } from "@/lib/company-settings";
import { STATE_CODES } from "@/lib/india";
import { invoiceNumber, isInterState } from "@/lib/invoice";

export function einvoiceConfigured(): boolean {
  return Boolean(
    process.env.EINVOICE_API_URL && process.env.EINVOICE_AUTH_TOKEN,
  );
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
    unit_price: number;
    line_total: number;
    gst_rate: number;
    hsn_code: string | null;
  }[];
};

// Builds an IRP e-invoice JSON (schema v1.1, subset) for a B2B order.
function buildPayload(order: OrderRow, company: Company) {
  const interState = isInterState(order.state, company.state);
  const sellerStateCode = STATE_CODES[company.state] ?? "";
  const buyerStateCode = order.state ? (STATE_CODES[order.state] ?? "") : "";

  const items = order.order_items.map((i, idx) => {
    const rate = Number(i.gst_rate) || 0;
    const taxable = Math.round(i.line_total / (1 + rate / 100));
    const gst = i.line_total - taxable;
    return {
      SlNo: String(idx + 1),
      PrdDesc: i.product_name,
      IsServc: "N",
      HsnCd: i.hsn_code ?? "",
      Qty: i.quantity,
      UnitPrice: Math.round(i.unit_price / (1 + rate / 100)),
      TotAmt: taxable,
      AssAmt: taxable,
      GstRt: rate,
      IgstAmt: interState ? gst : 0,
      CgstAmt: interState ? 0 : Math.floor(gst / 2),
      SgstAmt: interState ? 0 : gst - Math.floor(gst / 2),
      TotItemVal: i.line_total,
    };
  });

  const totTaxable = items.reduce((s, i) => s + i.AssAmt, 0);
  const totGst = order.total_amount - totTaxable;

  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B" },
    DocDtls: {
      Typ: "INV",
      No: invoiceNumber(order.invoice_no, order.invoice_fy),
      Dt: new Date(order.created_at).toLocaleDateString("en-GB"),
    },
    SellerDtls: {
      Gstin: company.gstin,
      LglNm: company.name,
      Addr1: company.addressLines[0] ?? "",
      Loc: company.state,
      Stcd: sellerStateCode,
    },
    BuyerDtls: {
      Gstin: order.customer_gstin,
      LglNm: order.delivery_name ?? "",
      Pos: buyerStateCode,
      Addr1: order.address ?? "",
      Loc: order.city ?? "",
      Stcd: buyerStateCode,
    },
    ItemList: items,
    ValDtls: {
      AssVal: totTaxable,
      IgstVal: interState ? totGst : 0,
      CgstVal: interState ? 0 : Math.floor(totGst / 2),
      SgstVal: interState ? 0 : totGst - Math.floor(totGst / 2),
      TotInvVal: order.total_amount,
    },
  };
}

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function withinCancelWindow(irnDate: string | null): boolean {
  if (!irnDate) return false;
  return Date.now() - new Date(irnDate).getTime() <= CANCEL_WINDOW_MS;
}

export async function cancelEInvoice(
  orderId: string,
  reason = "Order cancelled",
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("irn, irn_date, irn_cancelled_at")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.irn) return { ok: false, error: "No e-invoice to cancel" };
  if (order.irn_cancelled_at) return { ok: true };
  if (!withinCancelWindow(order.irn_date)) {
    return { ok: false, error: "24-hour cancellation window has passed" };
  }

  const cancelUrl = process.env.EINVOICE_CANCEL_URL;
  if (cancelUrl) {
    try {
      const res = await fetch(cancelUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EINVOICE_AUTH_TOKEN}`,
        },
        body: JSON.stringify({ Irn: order.irn, CnlRsn: "1", CnlRem: reason }),
      });
      if (!res.ok) return { ok: false, error: `IRP error ${res.status}` };
    } catch (err) {
      console.error("cancelEInvoice failed:", err);
      return { ok: false, error: "IRP request failed" };
    }
  }

  await admin
    .from("orders")
    .update({ irn_cancelled_at: new Date().toISOString() })
    .eq("id", orderId);
  return { ok: true };
}

export async function generateEInvoice(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      "id, invoice_no, invoice_fy, created_at, customer_gstin, delivery_name, address, city, state, pincode, total_amount, irn, order_items(product_name, quantity, unit_price, line_total, gst_rate, hsn_code)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { ok: false, error: "Order not found" };
  if (order.irn) return { ok: true };
  if (!order.customer_gstin) {
    return { ok: false, error: "Order has no buyer GSTIN (B2C)" };
  }
  if (!einvoiceConfigured()) {
    return { ok: false, error: "E-invoicing is not configured" };
  }

  try {
    const company = await getCompany();
    const res = await fetch(process.env.EINVOICE_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EINVOICE_AUTH_TOKEN}`,
      },
      body: JSON.stringify(buildPayload(order as OrderRow, company)),
    });
    if (!res.ok) {
      return { ok: false, error: `IRP error ${res.status}` };
    }
    const data = (await res.json()) as {
      Irn?: string;
      SignedQRCode?: string;
    };
    if (!data.Irn) return { ok: false, error: "No IRN returned" };

    await admin
      .from("orders")
      .update({
        irn: data.Irn,
        signed_qr: data.SignedQRCode ?? null,
        irn_date: new Date().toISOString(),
      })
      .eq("id", orderId);
    return { ok: true };
  } catch (err) {
    console.error("generateEInvoice failed:", err);
    return { ok: false, error: "IRP request failed" };
  }
}
