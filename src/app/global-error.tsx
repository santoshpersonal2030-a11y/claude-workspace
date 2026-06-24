"use client";

import { useEffect } from "react";

// Top-level boundary for errors thrown in the root layout. Must render its own
// <html>/<body>. Reports to the server before showing a minimal fallback.
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ fontSize: 40 }}>🛕</div>
        <h1 style={{ marginTop: 16 }}>Something went wrong</h1>
        <p style={{ color: "#666", maxWidth: 360 }}>
          We hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            borderRadius: 9999,
            background: "#d97706",
            color: "white",
            border: "none",
            padding: "10px 24px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
