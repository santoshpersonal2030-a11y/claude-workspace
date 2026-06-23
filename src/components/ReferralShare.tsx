"use client";

import { useState } from "react";

// Shows the referral link with copy + native-share buttons.
export default function ReferralShare({
  code,
  url,
}: {
  code: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "BookMyPoojari",
          text: `Book verified Pandits & pooja samagri on BookMyPoojari. Use my code ${code} for a welcome bonus!`,
          url,
        });
      } catch {
        /* user dismissed */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <code className="rounded-lg bg-cream px-3 py-2 font-mono text-sm font-semibold text-maroon-700">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-saffron-300 px-4 py-1.5 text-sm font-semibold text-saffron-700 hover:bg-saffron-50"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={share}
        className="rounded-full bg-saffron-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-saffron-700"
      >
        Share
      </button>
    </div>
  );
}
