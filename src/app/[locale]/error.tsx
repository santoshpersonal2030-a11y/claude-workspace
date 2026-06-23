"use client";

import { useEffect } from "react";

// Route-level error boundary. Reports to the server (which forwards to Sentry
// when configured) and offers a retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/observability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="text-4xl">🪔</div>
      <h1 className="mt-4 font-heading text-2xl text-maroon-800">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-foreground/65">
        We hit an unexpected error. Please try again — our team has been
        notified.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-700"
      >
        Try again
      </button>
    </div>
  );
}
