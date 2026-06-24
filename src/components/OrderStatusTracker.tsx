// Visual progress tracker for an order's fulfilment status.
const STEPS = ["paid", "packed", "shipped", "delivered"] as const;
const LABELS: Record<(typeof STEPS)[number], string> = {
  paid: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function OrderStatusTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-xl bg-maroon-50 px-3 py-2 text-sm font-medium text-maroon-700">
        This order was cancelled.
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="rounded-xl bg-saffron-50 px-3 py-2 text-sm font-medium text-saffron-700">
        Awaiting payment.
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-saffron-700 text-white"
                    : "bg-saffron-100 text-saffron-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-[11px] ${
                  done ? "text-maroon-700" : "text-foreground/65"
                }`}
              >
                {LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 ${
                  i < currentIndex ? "bg-saffron-600" : "bg-saffron-100"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
