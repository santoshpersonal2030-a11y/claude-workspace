import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import RateImporter from "@/components/admin/RateImporter";

/* GST rates: bulk import, plus the health view that replaces the accountant Santosh does not
   have. Everything here is read-only except the importer, and the importer previews before it
   writes. */

export default async function AdminGstRatesPage() {
  await requireCapability("products");
  const admin = createAdminClient();

  const { data: products } = await admin
    .from("products")
    .select("id, name, slug, gst_rate, hsn_code, gst_rate_source, gst_rate_derived")
    .order("gst_rate")
    .order("name");

  const rows = (products ?? []) as unknown as {
    id: string;
    name: string;
    slug: string;
    gst_rate: number;
    hsn_code: string | null;
    gst_rate_source: string | null;
    gst_rate_derived: boolean | null;
  }[];

  const unverified = rows.filter((p) => !p.gst_rate_source);
  const noHsn = rows.filter((p) => !p.hsn_code);

  const { data: imports } = await admin
    .from("rate_imports")
    .select("id, filename, uploaded_by, uploaded_at, summary")
    .order("uploaded_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-maroon-800">GST rates</h1>
        <p className="mt-1 text-sm text-foreground/65">
          Change many rates at once with a spreadsheet. Nothing is applied until you have seen
          exactly what would change.
        </p>
      </div>

      <RateImporter />

      {/* --- the health view ------------------------------------------------ */}
      <section>
        <h2 className="font-heading text-lg text-maroon-800">Current rates</h2>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/65">
              <th className="pb-1">Product</th>
              <th className="pb-1">Rate</th>
              <th className="pb-1">HSN</th>
              <th className="pb-1">Where it came from</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-saffron-100">
                <td className="py-1.5">
                  {p.name}
                  {p.gst_rate_derived && (
                    <span className="ml-2 rounded bg-saffron-100 px-1.5 py-0.5 text-[11px] text-maroon-700">
                      calculated from contents
                    </span>
                  )}
                </td>
                <td className="py-1.5">{p.gst_rate}%</td>
                <td className="py-1.5 text-foreground/70">{p.hsn_code ?? "—"}</td>
                <td className="py-1.5 text-foreground/70">
                  {p.gst_rate_source ?? (
                    <span className="text-amber-700">not recorded</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* A rate nobody can account for is not a decision; it is a guess that survived. */}
      {unverified.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            {unverified.length} rate{unverified.length === 1 ? " has" : "s have"} no recorded
            source
          </p>
          <p className="mt-1 text-sm text-amber-800">
            The number may well be right — but nothing records who decided it or why, so if one is
            ever questioned there is no way to answer for it without re-checking all of them.
          </p>
          <p className="mt-2 text-sm text-amber-800">
            {unverified.map((p) => p.name).join(", ")}
          </p>
        </div>
      )}

      {noHsn.length > 0 && (
        <div className="rounded-xl border border-saffron-200 bg-cream p-4 text-sm text-foreground/75">
          <strong>{noHsn.length}</strong> product{noHsn.length === 1 ? " has" : "s have"} no HSN
          code. Not urgent at your turnover, but GSTR-1 wants an HSN summary — and an HSN should
          be confirmed rather than copied, so these are deliberately blank rather than guessed.
        </div>
      )}

      {imports && imports.length > 0 && (
        <section>
          <h2 className="font-heading text-lg text-maroon-800">Recent imports</h2>
          <ul className="mt-2 space-y-1 text-sm text-foreground/75">
            {imports.map((i) => (
              <li key={i.id}>
                <strong>{i.filename ?? "(no name)"}</strong> — {i.summary} ·{" "}
                {new Date(i.uploaded_at as string).toLocaleString("en-IN")} · {i.uploaded_by}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
