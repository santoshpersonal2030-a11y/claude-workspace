import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import PrintButton from "@/components/PrintButton";
import { formatINR } from "@/lib/poojas";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Booking receipt" };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/bookings/${id}/invoice`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, booking_date, time_slot, language, address, city, pincode, samagri_kit, service_price, samagri_price, total_amount, created_at, poojas(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/account/bookings/${booking.id}`}
          className="text-sm text-foreground/60 hover:text-saffron-700"
        >
          ← Back to booking
        </Link>
        <PrintButton />
      </div>

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
            <div className="text-foreground/60">#{booking.id.slice(0, 8)}</div>
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
          Thank you for booking with BookMyPoojari · Status: {booking.status}
        </p>
      </div>
    </main>
  );
}
