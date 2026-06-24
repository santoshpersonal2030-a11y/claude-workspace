"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Submits to /search?q=… (a GET-style navigation). The search page's main field.
export default function SearchBox({
  defaultValue = "",
  placeholder,
  ariaLabel,
}: {
  defaultValue?: string;
  placeholder: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form role="search" onSubmit={submit} className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
      >
        🔎
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-full border border-saffron-200 bg-white py-3 pl-11 pr-4 text-base outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100"
      />
    </form>
  );
}
