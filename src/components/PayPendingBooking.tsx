"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { payWithRazorpay } from "@/lib/razorpay-client";
import { formatINR } from "@/lib/poojas";

// "Pay now" for a pending booking. Creates a Razorpay order on our server, opens
// Checkout, then refreshes once the shared verify route has confirmed it.
export default function PayPendingBooking({
  bookingId,
  amount,
}: {
  bookingId: string;
  amount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start the payment.");
        return;
      }
      if (!data.razorpay) {
        setError("Online payment isn't available yet — we'll contact you.");
        return;
      }
      const result = await payWithRazorpay(data.razorpay, undefined, "Pooja booking");
      if (result.ok) router.refresh();
      else setError(result.error ?? "Payment was cancelled.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-saffron-50 pt-4">
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="w-full rounded-full bg-saffron-700 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
      >
        {busy ? "Starting payment…" : `Pay ${formatINR(amount)} now`}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
