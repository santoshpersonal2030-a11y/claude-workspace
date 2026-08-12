import { formatINR } from "@/lib/poojas";
import { invoiceNumber } from "@/lib/invoice";
import { amountInWords } from "@/lib/amount-in-words";
import { COMPANY, type Company } from "@/lib/company";
import { bookingTax } from "@/lib/booking-gst";
import SignatureBlock from "@/components/receipts/SignatureBlock";
import BrandMark from "@/components/receipts/BrandMark";

export type BookingReceiptData = {
  invoice_no: number | null;
  invoice_fy: number | null;
  id: string;
  created_at: string;
  status: string;
  booking_date: string;
  time_slot: string;
  language: string | null;
  address: string;
  city: string;
  pincode: string | null;
  samagri_kit: boolean;
  service_price: number;
  samagri_price: number;
  total_amount: number;
  poojas: { name: string } | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BookingReceipt({
  booking,
  qrDataUrl,
  company = COMPANY,
}: {
  booking: BookingReceiptData;
  qrDataUrl?: string | null;
  company?: Company;
}) {
  const tax = bookingTax(booking.samagri_kit ? booking.samagri_price : 0);
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
          <div className="font-heading text-lg text-maroon-700">Receipt</div>
          <div className="text-foreground/65">
            {invoiceNumber(booking.invoice_no, booking.invoice_fy, "BKG")}
          </div>
          <div className="text-foreground/65">
            {formatDate(booking.created_at)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-foreground/65">Ceremony</div>
          <div className="font-medium text-foreground">
            {booking.poojas?.name ?? "Pooja"}
          </div>
          <div className="text-foreground/70">
            {formatDate(booking.booking_date)} · {booking.time_slot}
          </div>
          {booking.language && (
            <div className="text-foreground/70">{booking.language}</div>
          )}
        </div>
        <div>
          <div className="text-foreground/65">Venue</div>
          <div className="text-foreground/70">{booking.address}</div>
          <div className="text-foreground/70">
            {[booking.city, booking.pincode].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/65">Service (dakshina)</span>
          <span>{formatINR(booking.service_price)}</span>
        </div>
        {booking.samagri_kit && (
          <>
            <div className="flex justify-between">
              <span className="text-foreground/65">Samagri kit</span>
              <span>{formatINR(booking.samagri_price)}</span>
            </div>
            {/* The kit is GOODS, so the religious-ceremony exemption does not reach it. The
                price is GST-INCLUSIVE, so this only DISCLOSES the tax already inside it — the
                total below does not move by a rupee. See src/lib/booking-gst.ts. */}
            {tax.samagri && (
              <div className="flex justify-between text-xs text-foreground/55">
                <span>incl. GST @ {tax.samagri.rate}%</span>
                <span>{formatINR(tax.samagri.tax)}</span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between border-t border-saffron-100 pt-1 text-base font-semibold">
          <span>Total</span>
          <span className="text-saffron-700">
            {formatINR(booking.total_amount)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground/70">
        <span className="text-foreground/65">Amount in words: </span>
        {amountInWords(booking.total_amount)}
      </p>

      <SignatureBlock qrDataUrl={qrDataUrl} company={company} />

      <p className="mt-4 text-center text-xs text-foreground/65">
        {/* Was a blanket "Religious services are GST-exempt", printed on a receipt that also
            sells goods — which read as though the exemption covered the kit. It does not. */}
        The dakshina is exempt from GST (conduct of a religious ceremony).
        {booking.samagri_kit && !tax.samagri
          ? " The samagri kit is goods and is taxable; its rate is not yet configured, so no tax is shown against it."
          : ""}{" "}
        · Status: {booking.status} · Thank you for booking with BookMyPoojari
      </p>
    </div>
  );
}
