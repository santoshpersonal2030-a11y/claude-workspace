"use client";

// Loads the Razorpay Checkout script once and resolves when it's ready.
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(
      "script[src='https://checkout.razorpay.com/v1/checkout.js']",
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type PaymentDetails = {
  orderId: string;
  amount: number;
  keyId?: string;
};

export type PaymentResult = { ok: boolean; error?: string };

// Opens Razorpay Checkout for a created order, then verifies the result on our
// server. Resolves with { ok: true } only after server-side verification.
export async function payWithRazorpay(
  payment: PaymentDetails,
  prefill?: { name?: string; email?: string; contact?: string },
  description = "BookMyPoojari",
): Promise<PaymentResult> {
  const loaded = await loadRazorpayScript();
  if (!loaded) return { ok: false, error: "Could not load the payment window." };
  if (!payment.keyId) return { ok: false, error: "Payments are not configured." };

  return new Promise((resolve) => {
    const rzp = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: "INR",
      name: "BookMyPoojari",
      description,
      prefill,
      theme: { color: "#d97706" },
      handler: async (response) => {
        try {
          const res = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          resolve(
            res.ok
              ? { ok: true }
              : { ok: false, error: "Payment could not be verified." },
          );
        } catch {
          resolve({ ok: false, error: "Payment verification failed." });
        }
      },
      modal: {
        ondismiss: () => resolve({ ok: false, error: "Payment cancelled." }),
      },
    });
    rzp.open();
  });
}
