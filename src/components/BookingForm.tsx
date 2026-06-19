"use client";

import { useState } from "react";
import {
  type Pooja,
  languages,
  timeSlots,
  formatINR,
  getSamagriKitPrice,
} from "@/lib/poojas";

export default function BookingForm({ pooja }: { pooja: Pooja }) {
  const kitPrice = getSamagriKitPrice(pooja);

  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [language, setLanguage] = useState("Hindi");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [addKit, setAddKit] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const total = pooja.startingPrice + (addKit ? kitPrice : 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Backend (login + payment) is wired up in a later step.
    // For now we confirm the details have been captured.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="text-4xl">🙏</div>
          <h3 className="mt-3 font-heading text-xl text-maroon-700">
            Booking details captured
          </h3>
          <p className="mt-2 text-sm text-foreground/65">
            We&apos;ve noted your request for <strong>{pooja.name}</strong> on{" "}
            <strong>{date || "your chosen date"}</strong>. The next steps —
            secure login and payment — are being set up. Our team will confirm
            your Pandit shortly.
          </p>
        </div>
        <dl className="mt-5 space-y-2 border-t border-saffron-50 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/60">Date</dt>
            <dd className="font-medium">{date || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Time</dt>
            <dd className="font-medium">{slot || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Language</dt>
            <dd className="font-medium">{language}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Samagri kit</dt>
            <dd className="font-medium">{addKit ? "Yes" : "No"}</dd>
          </div>
          <div className="flex justify-between border-t border-saffron-50 pt-2 text-base">
            <dt className="font-semibold">Estimated total</dt>
            <dd className="font-semibold text-saffron-700">
              {formatINR(total)}
            </dd>
          </div>
        </dl>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-5 w-full rounded-full border border-saffron-300 bg-white py-2.5 text-sm font-semibold text-saffron-700 transition-colors hover:bg-saffron-50"
        >
          Edit details
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-heading text-xl text-maroon-700">Book this pooja</h3>
      <p className="mt-1 text-sm text-foreground/60">
        Fill in your details and we&apos;ll arrange everything.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Date
          </label>
          <input
            type="date"
            required
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Preferred time
          </label>
          <select
            required
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          >
            <option value="" disabled>
              Select a time slot
            </option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Pandit&apos;s language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            City
          </label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Pune"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Full address
          </label>
          <textarea
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="House / flat, street, area, pin code"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-saffron-100 bg-saffron-50/60 p-3">
          <input
            type="checkbox"
            checked={addKit}
            onChange={(e) => setAddKit(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-saffron-600"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">
              Add samagri kit — {formatINR(kitPrice)}
            </span>
            <span className="block text-foreground/60">
              All pooja items delivered to your door.
            </span>
          </span>
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            Special requests (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any specific rituals, gotra, or preferences"
            className="w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-saffron-50 pt-4">
        <span className="text-sm text-foreground/60">Estimated total</span>
        <span className="font-heading text-xl text-saffron-700">
          {formatINR(total)}
        </span>
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-full bg-saffron-600 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
      >
        Continue to book
      </button>
      <p className="mt-3 text-center text-xs text-foreground/50">
        You won&apos;t be charged yet. We&apos;ll confirm your Pandit first.
      </p>
    </form>
  );
}
