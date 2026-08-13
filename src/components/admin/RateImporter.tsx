"use client";

import { useState, useTransition } from "react";

import { previewRateImport, applyRateImport } from "@/app/[locale]/admin/actions";
import type { RatePlan } from "@/lib/rate-import";

/* The upload -> PREVIEW -> apply flow. The preview step is not skippable, and that is the whole
   design: a bulk change nobody looked at is how 114 rates go wrong at once. */

const box = "rounded-xl border border-saffron-200 bg-cream p-4";

export default function RateImporter() {
  const [csv, setCsv] = useState("");
  const [filename, setFilename] = useState("");
  const [plan, setPlan] = useState<RatePlan | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setPlan(null);
    setErrors([]);
    setDone(null);
    if (!f) return;
    setFilename(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsv(text);
      start(async () => {
        const r = await previewRateImport(text);
        if (r.ok) setPlan(r.plan);
        else setErrors(r.errors);
      });
    };
    reader.readAsText(f);
  }

  function apply() {
    start(async () => {
      const r = await applyRateImport(csv, filename);
      if (r.ok) {
        setDone(`${r.applied} product${r.applied === 1 ? "" : "s"} updated — ${r.summary}`);
        setPlan(null);
        setCsv("");
      } else {
        setErrors(r.errors);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className={box}>
        <label className="block text-sm font-medium text-maroon-800">
          Upload a CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            disabled={pending}
            className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-saffron-500 file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
        </label>
        <p className="mt-2 text-xs text-foreground/65">
          In Excel: <strong>File → Save As → CSV</strong>. Needs a <code>slug</code> column
          and a <code>gst_rate</code> column. Optional: <code>hsn_code</code>,{" "}
          <code>source</code>, <code>note</code>.{" "}
          <strong>Leave a rate blank to keep it unchanged</strong> — blank does not mean 0%.
        </p>
      </div>

      {pending && <p className="text-sm text-foreground/65">Working…</p>}

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Nothing was changed. Fix these and upload again:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          {done}
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          <div className={box}>
            <h2 className="font-heading text-lg text-maroon-800">
              {plan.changes.length} change{plan.changes.length === 1 ? "" : "s"} — nothing applied yet
            </h2>

            {plan.changes.length > 0 ? (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-foreground/65">
                    <th className="pb-1">Product</th>
                    <th className="pb-1">Rate</th>
                    <th className="pb-1">HSN</th>
                    <th className="pb-1">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.changes.map((c) => (
                    <tr key={c.id} className="border-t border-saffron-100">
                      <td className="py-1.5">{c.name}</td>
                      <td className="py-1.5">
                        {c.fromRate === c.toRate ? (
                          <span className="text-foreground/50">{c.toRate}%</span>
                        ) : (
                          <>
                            <span className="text-foreground/50 line-through">{c.fromRate}%</span>{" "}
                            <strong className="text-maroon-800">{c.toRate}%</strong>
                          </>
                        )}
                      </td>
                      <td className="py-1.5 text-foreground/70">
                        {c.fromHsn !== c.toHsn ? `${c.fromHsn ?? "—"} → ${c.toHsn ?? "—"}` : (c.toHsn ?? "—")}
                      </td>
                      <td className="py-1.5 text-foreground/70">{c.source ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-foreground/65">
                Every row in the file already matches the catalogue.
              </p>
            )}

            {plan.changes.length > 0 && (
              <button
                type="button"
                onClick={apply}
                disabled={pending}
                className="mt-4 rounded-lg bg-saffron-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Apply {plan.changes.length} change{plan.changes.length === 1 ? "" : "s"}
              </button>
            )}
          </div>

          {/* Everything the file did NOT do, stated. A silent skip reports all-clear. */}
          {plan.blocked.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                {plan.blocked.length} refused — these rates are calculated, not set by hand
              </p>
              <ul className="mt-1 space-y-1 text-sm text-amber-800">
                {plan.blocked.map((b) => (
                  <li key={b.slug}>
                    <strong>{b.name}</strong> — {b.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.unmatched.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                {plan.unmatched.length} row{plan.unmatched.length === 1 ? "" : "s"} in the file
                match no product
              </p>
              <ul className="mt-1 space-y-1 text-sm text-amber-800">
                {plan.unmatched.map((u) => (
                  <li key={u.slug}>
                    line {u.line}: <code>{u.slug}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(plan.unchanged.length > 0 || plan.absent.length > 0) && (
            <p className="text-xs text-foreground/60">
              {plan.unchanged.length} already correct · {plan.absent.length} product
              {plan.absent.length === 1 ? "" : "s"} not mentioned in the file (left alone)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
