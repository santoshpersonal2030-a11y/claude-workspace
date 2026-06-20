import { formatINR } from "@/lib/poojas";

// GST is treated as included in the displayed prices (common for Indian retail).
const GST_RATE = 0.18;

export type OrderInvoiceData = {
  invoice_no: number | null;
  id: string;
  created_at: string;
  status: string;
  delivery_name: string | null;
  delivery_phone: string | null;
  address: string | null;
  city: string | null;
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
  }[];
};

export function invoiceNumber(no: number | null, prefix = "INV"): string {
  return no ? `${prefix}-${no}` : "—";
}

export default function OrderInvoice({ order }: { order: OrderInvoiceData }) {
  // Back out the GST component from the GST-inclusive total.
  const taxable = Math.round(order.total_amount / (1 + GST_RATE));
  const gst = order.total_amount - taxable;
  const cgst = Math.floor(gst / 2);
  const sgst = gst - cgst;

  return (
    <div className="rounded-2xl border border-saffron-100 p-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-heading text-xl text-maroon-800">
            🪔 BookMyPoojari
          </div>
          <p className="text-xs text-foreground/55">bookmypoojari.com</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-heading text-lg text-maroon-700">
            Tax Invoice
          </div>
          <div className="text-foreground/60">
            {invoiceNumber(order.invoice_no)}
          </div>
          <div className="text-foreground/60">
            {new Date(order.created_at).toLocaleDateString("en-IN")}
          </div>
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
          {[order.city, order.pincode].filter(Boolean).join(" · ")}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-saffron-100 text-left text-foreground/55">
            <th className="py-2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((i) => (
            <tr key={i.id} className="border-b border-saffron-50">
              <td className="py-2">{i.product_name}</td>
              <td className="py-2 text-center">{i.quantity}</td>
              <td className="py-2 text-right">{formatINR(i.unit_price)}</td>
              <td className="py-2 text-right">{formatINR(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">Taxable value</span>
          <span>{formatINR(taxable)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">CGST (9%)</span>
          <span>{formatINR(cgst)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">SGST (9%)</span>
          <span>{formatINR(sgst)}</span>
        </div>
        <div className="flex justify-between border-t border-saffron-50 pt-1">
          <span className="text-foreground/60">Shipping</span>
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

      <p className="mt-8 text-center text-xs text-foreground/50">
        Prices are inclusive of GST · Status: {order.status} · Thank you for
        shopping with BookMyPoojari
      </p>
    </div>
  );
}
