"use client";

import { useState, useTransition } from "react";

import { revealKycId } from "@/app/[locale]/admin/actions";

// On-demand reveal of an applicant's full KYC ID. The plaintext is fetched only
// when the admin clicks (the list ships just the masked value), shown until they
// hide it again, and every reveal is audited server-side.
export function RevealKycId({ applicationId }: { applicationId: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reveal() {
    setError(null);
    startTransition(async () => {
      const result = await revealKycId(applicationId);
      if (result.ok) setValue(result.idNumber);
      else setError(result.error);
    });
  }

  if (value) {
    return (
      <span className="ml-2 inline-flex items-center gap-2">
        <span className="font-mono text-foreground/90">{value}</span>
        <button
          type="button"
          onClick={() => setValue(null)}
          className="text-xs text-saffron-700 underline"
        >
          Hide
        </button>
      </span>
    );
  }

  return (
    <span className="ml-2 inline-flex items-center gap-2">
      <button
        type="button"
        onClick={reveal}
        disabled={pending}
        className="text-xs text-saffron-700 underline disabled:opacity-50"
      >
        {pending ? "Revealing…" : "Reveal"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
