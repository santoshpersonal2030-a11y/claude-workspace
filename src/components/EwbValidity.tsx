"use client";

import { useEffect, useState } from "react";

function remaining(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Live e-way bill validity badge: green (valid), saffron (<6h), maroon (expired).
export default function EwbValidity({ validUntil }: { validUntil: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const ms = new Date(validUntil).getTime() - now;
  const expired = ms <= 0;
  const soon = !expired && ms < 6 * 3_600_000;
  const cls = expired
    ? "bg-maroon-50 text-maroon-700"
    : soon
      ? "bg-saffron-100 text-saffron-700"
      : "bg-green-50 text-green-700";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {expired ? "EWB expired" : `EWB ${remaining(ms)} left`}
    </span>
  );
}
