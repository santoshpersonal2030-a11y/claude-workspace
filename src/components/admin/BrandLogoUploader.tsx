"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

// Uploads the brand logo (JPEG) to Storage at brand/logo.jpg. Used by invoice
// PDFs and the /api/brand-logo image.
export default function BrandLogoUploader() {
  const supabase = useMemo(() => createClient(), []);
  const [preview, setPreview] = useState<string>("/api/brand-logo");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/jpeg") {
      setError("Please upload a JPEG (.jpg) image.");
      return;
    }
    setError(null);
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload("brand/logo.jpg", file, {
        upsert: true,
        contentType: "image/jpeg",
      });
    setBusy(false);
    if (upErr) {
      setError("Upload failed.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={preview}
        alt=""
        className="h-20 w-20 rounded border border-saffron-100 object-contain"
      />
      <div>
        <label className="inline-block cursor-pointer rounded-full bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
          {busy ? "Uploading…" : "Upload JPEG logo"}
          <input
            type="file"
            accept="image/jpeg"
            className="hidden"
            onChange={onChange}
          />
        </label>
        {done && (
          <p className="mt-2 text-sm text-green-700">
            Logo updated — it now appears on invoices and receipts.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-maroon-700">{error}</p>}
        <p className="mt-1 text-xs text-foreground/65">
          JPEG only. A square image works best.
        </p>
      </div>
    </div>
  );
}
