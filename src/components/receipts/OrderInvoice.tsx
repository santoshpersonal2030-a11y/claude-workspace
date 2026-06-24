import { formatINR } from "@/lib/poojas";
import { COMPANY, type Company } from "@/lib/company";
import { invoiceNumber, isInterState } from "@/lib/invoice";
import { placeOfSupply } from "@/lib/india";
import { amountInWords } from "@/lib/amount-in-words";
import { apportionDiscount, splitGst } from "@/lib/gst";
import SignatureBlock from "@/components/receipts/SignatureBlock";
import BrandMark from "@/components/receipts/BrandMark";

export type OrderInvoiceData = {
  invoice_no: number | null;
  invoice_fy: number | null;
  id: string;
  created_at: string;
  status: string;
  irn?: string | null;
  ewb_no?: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  subtotal: number;
  shipping: number;
  discount?: number | null;
  coupon_code?: string | null;
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
  company = COMPANY,
}: {
  order: OrderInvoiceData;
  qrDataUrl?: string | null;
  company?: Company;
}) {
  const interState = isInterState(order.state, company.state);

  // An order-level coupon discount reduces the taxable value, so apportion it
  // across the GST-inclusive lines before backing GST out.
  const discount = order.discount ?? 0;
  const discounted = apportionDiscount(
    order.order_items.map((i) => i.line_total),
    discount,
  );

  // HSN-wise tax summary (on the discounted, net values).
  const byHsn = new Map<
    string,
    { taxable: number; tax: number; total: number; rate: number }
  >();
  // Back out GST per line, grouped by rate (also on net values).
  const byRate = new Map<number, { taxable: number; gst: number }>();
  order.order_items.forEach((i, idx) => {
    const rate = Number(i.gst_rate) || 0;
    const { taxable, tax } = splitGst(discounted[idx], rate);

    const hKey = i.hsn_code ?? "—";
    const hCur = byHsn.get(hKey) ?? { taxable: 0, tax: 0, total: 0, rate };
    hCur.taxable += taxable;
    hCur.tax += tax;
    hCur.total += taxable + tax;
    byHsn.set(hKey, hCur);

    const rCur = byRate.get(rate) ?? { taxable: 0, gst: 0 };
    rCur.taxable += taxable;
    rCur.gst += tax;
    byRate.set(rate, rCur);
  });
  const hsnRows = [...byHsn.entries()];
  const rateRows = [...byRate.entries()].sort((a, b) => a[0] - b[0]);
  const totalTaxable = rateRows.reduce((s, [, v]) => s + v.taxable, 0);
  const totalGst = rateRows.reduce((s, [, v]) => s + v.gst, 0);

  return (
    <div className="rounded-2xl border border-saffron-100 p-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 font-heading text-xl text-maroon-800">
            <BrandMark className="h-8 w-8" />
            {company.name}
          </div>
          {company.addressLines.map((l) => (
            <p key={l} className="text-xs text-foreground/65">
              {l}
            </p>
          ))}
          <p className="text-xs text-foreground/65">GSTIN: {company.gstin}</p>
          <p className="text-xs text-foreground/65">
            {company.email} · {company.phone}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-heading text-lg text-maroon-700">
            Tax Invoice
          </div>
          <div className="text-foreground/65">
            {invoiceNumber(order.invoice_no, order.invoice_fy)}
          </div>
          <div className="text-foreground/65">
            {new Date(order.created_at).toLocaleDateString("en-IN")}
          </div>
          {order.irn && (
            <div className="mt-1 max-w-[180px] break-all text-[9px] text-foreground/65">
              IRN: {order.irn}
            </div>
          )}
          {order.ewb_no && (
            <div className="text-[9px] text-foreground/65">
              EWB: {order.ewb_no}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-sm">
        <div className="text-foreground/65">Billed to</div>
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
          <div className="mt-1 text-xs text-foreground/65">
            Place of supply: {placeOfSupply(order.state)}
          </div>
        )}
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-saffron-100 text-left text-foreground/65">
            <th scope="col" className="py-2">Item</th>
            <th scope="col" className="py-2">HSN</th>
            <th scope="col" className="py-2 text-center">GST</th>
            <th scope="col" className="py-2 text-center">Qty</th>
            <th scope="col" className="py-2 text-right">Price</th>
            <th scope="col" className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((i) => (
            <tr key={i.id} className="border-b border-saffron-50">
              <td className="py-2">{i.product_name}</td>
              <td className="py-2 text-foreground/65">{i.hsn_code ?? "—"}</td>
              <td className="py-2 text-center text-foreground/65">
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
        {discount > 0 && (
          <>
            <div className="flex justify-between text-foreground/65">
              <span>Items total</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
              <span>−{formatINR(discount)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-foreground/65">
          <span>Taxable value</span>
          <span>{formatINR(totalTaxable)}</span>
        </div>
        {rateRows.map(([rate, v]) =>
          interState ? (
            <div key={rate} className="flex justify-between text-foreground/65">
              <span>IGST {rate}%</span>
              <span>{formatINR(v.gst)}</span>
            </div>
          ) : (
            <div key={rate} className="flex justify-between text-foreground/65">
              <span>
                CGST {rate / 2}% + SGST {rate / 2}%
              </span>
              <span>{formatINR(v.gst)}</span>
            </div>
          ),
        )}
        <div className="flex justify-between border-t border-saffron-50 pt-1 text-foreground/65">
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
        <span className="text-foreground/65">Amount in words: </span>
        {amountInWords(order.total_amount)}
      </p>

      {/* HSN-wise tax summary */}
      <div className="mt-6">
        <div className="text-xs font-medium text-foreground/65">
          HSN / SAC summary
        </div>
        <table className="mt-1 w-full text-xs">
          <thead>
            <tr className="border-b border-saffron-100 text-left text-foreground/65">
              <th scope="col" className="py-1">HSN</th>
              <th scope="col" className="py-1 text-center">Rate</th>
              <th scope="col" className="py-1 text-right">Taxable</th>
              <th scope="col" className="py-1 text-right">Tax</th>
              <th scope="col" className="py-1 text-right">Total</th>
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

      <SignatureBlock qrDataUrl={qrDataUrl} company={company} />

      <p className="mt-4 text-center text-xs text-foreground/65">
        Total GST: {formatINR(totalGst)} · Prices inclusive of GST · Status:{" "}
        {order.status}
      </p>
    </div>
  );
}
