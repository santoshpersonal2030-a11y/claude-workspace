import { formatINR } from "@/lib/poojas";
import { COMPANY, type Company } from "@/lib/company";
import { invoiceNumber } from "@/lib/invoice";
import { amountInWords } from "@/lib/amount-in-words";
import SignatureBlock from "@/components/receipts/SignatureBlock";
import BrandMark from "@/components/receipts/BrandMark";

export type CreditNoteData = {
  invoice_no: number | null;
  invoice_fy: number | null;
  created_at: string;
  amount: number;
  reason: string | null;
  orders: {
    invoice_no: number | null;
    invoice_fy: number | null;
    delivery_name: string | null;
    delivery_phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  } | null;
};

export default function CreditNote({
  note,
  qrDataUrl,
  company = COMPANY,
}: {
  note: CreditNoteData;
  qrDataUrl?: string | null;
  company?: Company;
}) {
  const order = note.orders;
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
        </div>
        <div className="text-right text-sm">
          <div className="font-heading text-lg text-maroon-700">
            Credit Note
          </div>
          <div className="text-foreground/65">
            {invoiceNumber(note.invoice_no, note.invoice_fy, "CN")}
          </div>
          <div className="text-foreground/65">
            {new Date(note.created_at).toLocaleDateString("en-IN")}
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm">
        <div className="text-foreground/65">Issued to</div>
        <div className="font-medium text-foreground">
          {order?.delivery_name ?? "Customer"}
        </div>
        {order?.delivery_phone && (
          <div className="text-foreground/70">{order.delivery_phone}</div>
        )}
        {order?.address && (
          <div className="text-foreground/70">{order.address}</div>
        )}
        <div className="text-foreground/70">
          {[order?.city, order?.state, order?.pincode]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {order?.invoice_no && (
          <div className="mt-2 text-xs text-foreground/65">
            Against invoice:{" "}
            {invoiceNumber(order.invoice_no, order.invoice_fy)}
          </div>
        )}
      </div>

      <div className="mt-6 ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between border-t border-saffron-100 pt-1 text-base font-semibold">
          <span>Refund amount</span>
          <span className="text-saffron-700">{formatINR(note.amount)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground/70">
        <span className="text-foreground/65">Amount in words: </span>
        {amountInWords(note.amount)}
      </p>
      {note.reason && (
        <p className="mt-2 text-sm text-foreground/70">
          <span className="text-foreground/65">Reason: </span>
          {note.reason}
        </p>
      )}

      <SignatureBlock qrDataUrl={qrDataUrl} company={company} />

      <p className="mt-4 text-center text-xs text-foreground/65">
        This credit note reflects a refund processed to your original payment
        method.
      </p>
    </div>
  );
}
