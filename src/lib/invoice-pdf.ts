import { PdfDoc } from "@/lib/pdf";
import { COMPANY } from "@/lib/company";
import { logoJpeg } from "@/lib/logo";
import { invoiceNumber, isInterState } from "@/lib/invoice";
import { placeOfSupply } from "@/lib/india";
import { amountInWords } from "@/lib/amount-in-words";
import type { OrderInvoiceData } from "@/components/receipts/OrderInvoice";
import type { BookingReceiptData } from "@/components/receipts/BookingReceipt";

function drawLogo(doc: PdfDoc): void {
  const logo = logoJpeg();
  doc.imageJpeg(L, doc.fromTop(62), 36, 36, logo.data, logo.w, logo.h);
}

// Rupee formatting for PDF (ASCII-safe — Helvetica lacks the ₹ glyph).
const rs = (n: number) => `Rs. ${new Intl.NumberFormat("en-IN").format(n)}`;

const L = 40;
const R = 555;

export function buildOrderInvoicePdf(order: OrderInvoiceData): Buffer {
  const doc = new PdfDoc();
  const yt = (o: number) => doc.fromTop(o);

  // Header
  drawLogo(doc);
  doc.text(L + 46, yt(44), COMPANY.name, { size: 15, bold: true });
  doc.text(R, yt(50), "TAX INVOICE", { size: 13, bold: true, align: "right" });
  let ay = 72;
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
  if (order.irn) {
    doc.text(R, yt(90), `IRN: ${order.irn.slice(0, 24)}…`, {
      size: 7,
      align: "right",
    });
  }
  if (order.ewb_no) {
    doc.text(R, yt(99), `EWB: ${order.ewb_no}`, { size: 7, align: "right" });
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

  // Items table (auto-paginated)
  const PAGE_BOTTOM = 770;
  const drawItemsHeader = (atY: number): number => {
    doc.text(L, yt(atY), "Item", { size: 8, bold: true });
    doc.text(300, yt(atY), "HSN", { size: 8, bold: true });
    doc.text(345, yt(atY), "Rate", { size: 8, bold: true });
    doc.text(395, yt(atY), "Qty", { size: 8, bold: true });
    doc.text(475, yt(atY), "Price", { size: 8, bold: true, align: "right" });
    doc.text(R, yt(atY), "Total", { size: 8, bold: true, align: "right" });
    const next = atY + 5;
    doc.line(L, yt(next), R, yt(next));
    return next + 13;
  };

  let ty = drawItemsHeader(Math.max(by, 178) + 6);
  for (const i of order.order_items) {
    // Wrap long names within the item column (40 → ~295).
    const nameLines = doc.wrapText(i.product_name, 250, 9);
    const rowH = Math.max(14, nameLines.length * 11);
    if (ty + rowH > PAGE_BOTTOM) {
      doc.newPage();
      ty = drawItemsHeader(50);
    }
    nameLines.forEach((ln, n) =>
      doc.text(L, yt(ty + n * 11), ln, { size: 9 }),
    );
    doc.text(300, yt(ty), i.hsn_code ?? "-", { size: 9 });
    doc.text(345, yt(ty), `${Number(i.gst_rate)}%`, { size: 9 });
    doc.text(395, yt(ty), String(i.quantity), { size: 9 });
    doc.text(475, yt(ty), rs(i.unit_price), { size: 9, align: "right" });
    doc.text(R, yt(ty), rs(i.line_total), { size: 9, align: "right" });
    ty += rowH;
  }
  doc.line(L, yt(ty), R, yt(ty));
  ty += 14;

  // Keep the totals block together on a page.
  if (ty > 640) {
    doc.newPage();
    ty = 60;
  }

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

export function buildBookingReceiptPdf(booking: BookingReceiptData): Buffer {
  const doc = new PdfDoc();
  const yt = (o: number) => doc.fromTop(o);

  drawLogo(doc);
  doc.text(L + 46, yt(44), COMPANY.name, { size: 15, bold: true });
  doc.text(R, yt(50), "RECEIPT", { size: 13, bold: true, align: "right" });
  let ay = 72;
  for (const line of COMPANY.addressLines) {
    doc.text(L, yt(ay), line, { size: 8 });
    ay += 11;
  }
  doc.text(L, yt(ay), `GSTIN: ${COMPANY.gstin}`, { size: 8 });

  doc.text(
    R,
    yt(66),
    `Receipt: ${invoiceNumber(booking.invoice_no, booking.invoice_fy, "BKG")}`,
    { size: 9, align: "right" },
  );
  doc.text(
    R,
    yt(78),
    `Date: ${new Date(booking.created_at).toLocaleDateString("en-IN")}`,
    { size: 9, align: "right" },
  );

  doc.line(L, yt(108), R, yt(108));

  doc.text(L, yt(126), "Ceremony", { size: 8 });
  doc.text(L, yt(138), booking.poojas?.name ?? "Pooja", {
    size: 11,
    bold: true,
  });
  doc.text(
    L,
    yt(151),
    `${new Date(booking.booking_date).toLocaleDateString("en-IN")} · ${booking.time_slot}`,
    { size: 9 },
  );
  if (booking.language) doc.text(L, yt(163), booking.language, { size: 9 });

  doc.text(320, yt(126), "Venue", { size: 8 });
  doc.text(320, yt(138), (booking.address || "").slice(0, 40), { size: 9 });
  doc.text(
    320,
    yt(150),
    [booking.city, booking.pincode].filter(Boolean).join(", "),
    { size: 9 },
  );

  let ty = 200;
  doc.line(L, yt(ty - 8), R, yt(ty - 8));
  doc.text(360, yt(ty), "Service (dakshina)", { size: 9 });
  doc.text(R, yt(ty), rs(booking.service_price), { size: 9, align: "right" });
  ty += 14;
  if (booking.samagri_kit) {
    doc.text(360, yt(ty), "Samagri kit", { size: 9 });
    doc.text(R, yt(ty), rs(booking.samagri_price), { size: 9, align: "right" });
    ty += 14;
  }
  doc.line(340, yt(ty), R, yt(ty));
  ty += 14;
  doc.text(360, yt(ty), "Total", { size: 11, bold: true });
  doc.text(R, yt(ty), rs(booking.total_amount), {
    size: 11,
    bold: true,
    align: "right",
  });
  ty += 22;

  doc.text(
    L,
    yt(ty),
    `Amount in words: ${amountInWords(booking.total_amount)}`,
    { size: 9 },
  );
  ty += 16;
  doc.text(L, yt(ty), "Religious services are GST-exempt.", { size: 8 });
  ty += 36;
  doc.text(R, yt(ty), `For ${COMPANY.name}`, { size: 9, align: "right" });
  doc.text(R, yt(ty + 14), "Authorised Signatory", { size: 8, align: "right" });

  return doc.render();
}
