import { PdfDoc } from "@/lib/pdf";
import { COMPANY } from "@/lib/company";
import { invoiceNumber, isInterState } from "@/lib/invoice";
import { placeOfSupply } from "@/lib/india";
import { amountInWords } from "@/lib/amount-in-words";
import type { OrderInvoiceData } from "@/components/receipts/OrderInvoice";

// Rupee formatting for PDF (ASCII-safe — Helvetica lacks the ₹ glyph).
const rs = (n: number) => `Rs. ${new Intl.NumberFormat("en-IN").format(n)}`;

const L = 40;
const R = 555;

export function buildOrderInvoicePdf(
  order: OrderInvoiceData,
  extra?: { irn?: string | null },
): Buffer {
  const doc = new PdfDoc();
  const yt = (o: number) => doc.fromTop(o);

  // Header
  doc.text(L, yt(50), COMPANY.name, { size: 15, bold: true });
  doc.text(R, yt(50), "TAX INVOICE", { size: 13, bold: true, align: "right" });
  let ay = 66;
  for (const line of COMPANY.addressLines) {
    doc.text(L, yt(ay), line, { size: 8 });
    ay += 11;
  }
  doc.text(L, yt(ay), `GSTIN: ${COMPANY.gstin}`, { size: 8 });
  ay += 11;
  doc.text(L, yt(ay), `State: ${COMPANY.state}`, { size: 8 });

  doc.text(
    R,
    yt(66),
    `Invoice: ${invoiceNumber(order.invoice_no, order.invoice_fy)}`,
    { size: 9, align: "right" },
  );
  doc.text(
    R,
    yt(78),
    `Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}`,
    { size: 9, align: "right" },
  );
  if (extra?.irn) {
    doc.text(R, yt(90), `IRN: ${extra.irn.slice(0, 24)}…`, {
      size: 7,
      align: "right",
    });
  }

  doc.line(L, yt(108), R, yt(108));

  // Bill to
  doc.text(L, yt(124), "Billed to", { size: 8 });
  doc.text(L, yt(136), order.delivery_name ?? "Customer", {
    size: 10,
    bold: true,
  });
  let by = 148;
  if (order.delivery_phone) {
    doc.text(L, yt(by), order.delivery_phone, { size: 9 });
    by += 11;
  }
  if (order.address) {
    doc.text(L, yt(by), order.address.slice(0, 60), { size: 9 });
    by += 11;
  }
  doc.text(
    L,
    yt(by),
    [order.city, order.state, order.pincode].filter(Boolean).join(", "),
    { size: 9 },
  );
  by += 11;
  if (order.state) {
    doc.text(R, yt(124), `Place of supply: ${placeOfSupply(order.state)}`, {
      size: 8,
      align: "right",
    });
  }

  // Items table
  let ty = Math.max(by, 178) + 6;
  doc.text(L, yt(ty), "Item", { size: 8, bold: true });
  doc.text(300, yt(ty), "HSN", { size: 8, bold: true });
  doc.text(345, yt(ty), "Rate", { size: 8, bold: true });
  doc.text(395, yt(ty), "Qty", { size: 8, bold: true });
  doc.text(475, yt(ty), "Price", { size: 8, bold: true, align: "right" });
  doc.text(R, yt(ty), "Total", { size: 8, bold: true, align: "right" });
  ty += 5;
  doc.line(L, yt(ty), R, yt(ty));
  ty += 13;

  for (const i of order.order_items) {
    doc.text(L, yt(ty), i.product_name.slice(0, 42), { size: 9 });
    doc.text(300, yt(ty), i.hsn_code ?? "-", { size: 9 });
    doc.text(345, yt(ty), `${Number(i.gst_rate)}%`, { size: 9 });
    doc.text(395, yt(ty), String(i.quantity), { size: 9 });
    doc.text(475, yt(ty), rs(i.unit_price), { size: 9, align: "right" });
    doc.text(R, yt(ty), rs(i.line_total), { size: 9, align: "right" });
    ty += 14;
  }
  doc.line(L, yt(ty), R, yt(ty));
  ty += 14;

  // Tax summary + totals
  const interState = isInterState(order.state, COMPANY.state);
  let totalTaxable = 0;
  const byRate = new Map<number, number>();
  for (const i of order.order_items) {
    const rate = Number(i.gst_rate) || 0;
    const taxable = Math.round(i.line_total / (1 + rate / 100));
    totalTaxable += taxable;
    byRate.set(rate, (byRate.get(rate) ?? 0) + (i.line_total - taxable));
  }

  doc.text(380, yt(ty), "Taxable value", { size: 9 });
  doc.text(R, yt(ty), rs(totalTaxable), { size: 9, align: "right" });
  ty += 13;
  for (const [rate, tax] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    const label = interState ? `IGST ${rate}%` : `CGST+SGST ${rate}%`;
    doc.text(380, yt(ty), label, { size: 9 });
    doc.text(R, yt(ty), rs(tax), { size: 9, align: "right" });
    ty += 13;
  }
  doc.text(380, yt(ty), "Shipping", { size: 9 });
  doc.text(R, yt(ty), order.shipping === 0 ? "Free" : rs(order.shipping), {
    size: 9,
    align: "right",
  });
  ty += 8;
  doc.line(360, yt(ty), R, yt(ty));
  ty += 14;
  doc.text(380, yt(ty), "Total", { size: 11, bold: true });
  doc.text(R, yt(ty), rs(order.total_amount), {
    size: 11,
    bold: true,
    align: "right",
  });
  ty += 22;

  doc.text(L, yt(ty), `Amount in words: ${amountInWords(order.total_amount)}`, {
    size: 9,
  });
  ty += 40;

  doc.text(R, yt(ty), `For ${COMPANY.name}`, { size: 9, align: "right" });
  doc.text(R, yt(ty + 14), "Authorised Signatory", { size: 8, align: "right" });

  return doc.render();
}
