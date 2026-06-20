import { formatINR } from "@/lib/poojas";
import { COMPANY } from "@/lib/company";
import { invoiceNumber, isInterState } from "@/lib/invoice";
import { placeOfSupply } from "@/lib/india";
import { amountInWords } from "@/lib/amount-in-words";
import SignatureBlock from "@/components/receipts/SignatureBlock";

export type OrderInvoiceData = {
  invoice_no: number | null;
  invoice_fy: number | null;
  id: string;
  created_at: string;
  status: string;
  irn?: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  subtotal: number;
  shipping: number;
  total_amount: number;
  order_items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    gst_rate: number;
    hsn_code: string | null;
  }[];
};

export default function OrderInvoice({
  order,
  qrDataUrl,
}: {
  order: OrderInvoiceData;
  qrDataUrl?: string | null;
}) {
  const interState = isInterState(order.state, COMPANY.state);

  // HSN-wise tax summary.
  const byHsn = new Map<
    string,
    { taxable: number; tax: number; total: number; rate: number }
  >();
  for (const i of order.order_items) {
    const rate = Number(i.gst_rate) || 0;
    const taxable = Math.round(i.line_total / (1 + rate / 100));
    const key = i.hsn_code ?? "—";
    const cur = byHsn.get(key) ?? { taxable: 0, tax: 0, total: 0, rate };
    cur.taxable += taxable;
    cur.tax += i.line_total - taxable;
    cur.total += i.line_total;
    byHsn.set(key, cur);
  }
  const hsnRows = [...byHsn.entries()];
  // Back out GST per line (prices are GST-inclusive), grouped by rate.
  const byRate = new Map<number, { taxable: number; gst: number }>();
  for (const i of order.order_items) {
    const rate = Number(i.gst_rate) || 0;
    const taxable = Math.round(i.line_total / (1 + rate / 100));
    const gst = i.line_total - taxable;
    const cur = byRate.get(rate) ?? { taxable: 0, gst: 0 };
    cur.taxable += taxable;
    cur.gst += gst;
    byRate.set(rate, cur);
  }
  const rateRows = [...byRate.entries()].sort((a, b) => a[0] - b[0]);
  const totalTaxable = rateRows.reduce((s, [, v]) => s + v.taxable, 0);
  const totalGst = rateRows.reduce((s, [, v]) => s + v.gst, 0);

  return (
    <div className="rounded-2xl border border-saffron-100 p-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-heading text-xl text-maroon-800">
            🪔 {COMPANY.name}
          </div>
          {COMPANY.addressLines.map((l) => (
            <p key={l} className="text-xs text-foreground/55">
              {l}
            </p>
          ))}
          <p className="text-xs text-foreground/55">GSTIN: {COMPANY.gstin}</p>
          <p className="text-xs text-foreground/55">
            {COMPANY.email} · {COMPANY.phone}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-heading text-lg text-maroon-700">
            Tax Invoice
          </div>
          <div className="text-foreground/60">
            {invoiceNumber(order.invoice_no, order.invoice_fy)}
          </div>
          <div className="text-foreground/60">
            {new Date(order.created_at).toLocaleDateString("en-IN")}
          </div>
          {order.irn && (
            <div className="mt-1 max-w-[180px] break-all text-[9px] text-foreground/45">
              IRN: {order.irn}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm">
        <div className="text-foreground/55">Billed to</div>
        <div className="font-medium text-foreground">
          {order.delivery_name ?? "Customer"}
        </div>
        {order.delivery_phone && (
          <div className="text-foreground/70">{order.delivery_phone}</div>
        )}
        {order.address && (
          <div className="text-foreground/70">{order.address}</div>
        )}
        <div className="text-foreground/70">
          {[order.city, order.state, order.pincode]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {order.state && (
          <div className="mt-1 text-xs text-foreground/55">
            Place of supply: {placeOfSupply(order.state)}
          </div>
        )}
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-saffron-100 text-left text-foreground/55">
            <th className="py-2">Item</th>
            <th className="py-2">HSN</th>
            <th className="py-2 text-center">GST</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((i) => (
            <tr key={i.id} className="border-b border-saffron-50">
              <td className="py-2">{i.product_name}</td>
              <td className="py-2 text-foreground/60">{i.hsn_code ?? "—"}</td>
              <td className="py-2 text-center text-foreground/60">
                {Number(i.gst_rate)}%
              </td>
              <td className="py-2 text-center">{i.quantity}</td>
              <td className="py-2 text-right">{formatINR(i.unit_price)}</td>
              <td className="py-2 text-right">{formatINR(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tax summary by rate */}
      <div className="mt-4 ml-auto w-72 space-y-1 text-sm">
        <div className="flex justify-between text-foreground/60">
          <span>Taxable value</span>
          <span>{formatINR(totalTaxable)}</span>
        </div>
        {rateRows.map(([rate, v]) =>
          interState ? (
            <div key={rate} className="flex justify-between text-foreground/60">
              <span>IGST {rate}%</span>
              <span>{formatINR(v.gst)}</span>
            </div>
          ) : (
            <div key={rate} className="flex justify-between text-foreground/60">
              <span>
                CGST {rate / 2}% + SGST {rate / 2}%
              </span>
              <span>{formatINR(v.gst)}</span>
            </div>
          ),
        )}
        <div className="flex justify-between border-t border-saffron-50 pt-1 text-foreground/60">
          <span>Shipping</span>
          <span>
            {order.shipping === 0 ? "Free" : formatINR(order.shipping)}
          </span>
        </div>
        <div className="flex justify-between border-t border-saffron-100 pt-1 text-base font-semibold">
          <span>Total</span>
          <span className="text-saffron-700">
            {formatINR(order.total_amount)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground/70">
        <span className="text-foreground/55">Amount in words: </span>
        {amountInWords(order.total_amount)}
      </p>

      {/* HSN-wise tax summary */}
      <div className="mt-6">
        <div className="text-xs font-medium text-foreground/55">
          HSN / SAC summary
        </div>
        <table className="mt-1 w-full text-xs">
          <thead>
            <tr className="border-b border-saffron-100 text-left text-foreground/55">
              <th className="py-1">HSN</th>
              <th className="py-1 text-center">Rate</th>
              <th className="py-1 text-right">Taxable</th>
              <th className="py-1 text-right">Tax</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {hsnRows.map(([hsn, v]) => (
              <tr key={hsn} className="border-b border-saffron-50">
                <td className="py-1">{hsn}</td>
                <td className="py-1 text-center">{v.rate}%</td>
                <td className="py-1 text-right">{formatINR(v.taxable)}</td>
                <td className="py-1 text-right">{formatINR(v.tax)}</td>
                <td className="py-1 text-right">{formatINR(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SignatureBlock qrDataUrl={qrDataUrl} />

      <p className="mt-4 text-center text-xs text-foreground/50">
        Total GST: {formatINR(totalGst)} · Prices inclusive of GST · Status:{" "}
        {order.status}
      </p>
    </div>
  );
}
