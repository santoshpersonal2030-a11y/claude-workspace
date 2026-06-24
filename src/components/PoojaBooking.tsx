"use client";

import { useState } from "react";

import type { Pooja } from "@/lib/poojas";
import BookingForm from "@/components/BookingForm";
import OnlinePoojaForm from "@/components/OnlinePoojaForm";
import { useT } from "@/components/LanguageProvider";

type Pandits = React.ComponentProps<typeof BookingForm>["pandits"];

// Wraps the pooja booking widget with an "at home / online (video)" toggle,
// swapping between the full in-person BookingForm and the simpler OnlinePoojaForm
// without entangling the two.
export default function PoojaBooking({
  pooja,
  pandits,
}: {
  pooja: Pooja;
  pandits?: Pandits;
}) {
  const t = useT();
  const [mode, setMode] = useState<"in_person" | "online">("in_person");

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("bf.title")}
        className="mb-3 grid grid-cols-2 gap-1 rounded-full border border-saffron-100 bg-cream p-1"
      >
        {(["in_person", "online"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-saffron-700 text-white shadow-sm"
                : "text-foreground/70 hover:text-saffron-700"
            }`}
          >
            {m === "in_person" ? t("bf.modeHome") : t("bf.modeOnline")}
          </button>
        ))}
      </div>

      {mode === "online" ? (
        <OnlinePoojaForm pooja={pooja} />
      ) : (
        <BookingForm pooja={pooja} pandits={pandits} />
      )}
    </div>
  );
}
