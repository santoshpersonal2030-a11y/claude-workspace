import { formatINR } from "@/lib/poojas";
import { invoiceNumber } from "@/components/receipts/OrderInvoice";

export type BookingReceiptData = {
  invoice_no: number | null;
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
}: {
  booking: BookingReceiptData;
}) {
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
          <div className="font-heading text-lg text-maroon-700">Receipt</div>
          <div className="text-foreground/60">
            {invoiceNumber(booking.invoice_no, "BKG")}
          </div>
          <div className="text-foreground/60">
            {formatDate(booking.created_at)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-foreground/55">Ceremony</div>
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
          <div className="text-foreground/55">Venue</div>
          <div className="text-foreground/70">{booking.address}</div>
          <div className="text-foreground/70">
            {[booking.city, booking.pincode].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      <div className="mt-6 ml-auto w-56 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">Service (dakshina)</span>
          <span>{formatINR(booking.service_price)}</span>
        </div>
        {booking.samagri_kit && (
          <div className="flex justify-between">
            <span className="text-foreground/60">Samagri kit</span>
            <span>{formatINR(booking.samagri_price)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-saffron-100 pt-1 text-base font-semibold">
          <span>Total</span>
          <span className="text-saffron-700">
            {formatINR(booking.total_amount)}
          </span>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-foreground/50">
        Religious services are GST-exempt · Status: {booking.status} · Thank you
        for booking with BookMyPoojari
      </p>
    </div>
  );
}
