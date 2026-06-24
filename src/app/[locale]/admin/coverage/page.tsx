import { createAdminClient } from "@/lib/supabase/admin";

// Demand vs supply by pincode: where are customers booking, and is there an
// active priest who serves that pincode? Pincodes with demand but no (or thin)
// coverage are the recruitment targets.

type Row = {
  pincode: string;
  bookings: number;
  cities: string[];
  serving: string[];
};

function statusFor(serving: number): {
  label: string;
  className: string;
} {
  if (serving === 0)
    return { label: "Gap — no priest", className: "bg-maroon-50 text-maroon-700" };
  if (serving === 1)
    return { label: "Thin — 1 priest", className: "bg-gold-400 text-maroon-800" };
  return { label: `${serving} priests`, className: "bg-green-50 text-green-700" };
}

export default async function AdminCoveragePage() {
  const admin = createAdminClient();
  const [bookingsRes, panditsRes] = await Promise.all([
    admin.from("bookings").select("pincode, city").not("pincode", "is", null),
    admin
      .from("pandits")
      .select("full_name, service_pincodes")
      .eq("active", true),
  ]);

  const bookings = bookingsRes.data ?? [];
  const pandits = panditsRes.data ?? [];

  // pincode -> active priests who serve it
  const servingBy = new Map<string, string[]>();
  for (const p of pandits) {
    for (const pin of p.service_pincodes ?? []) {
      const list = servingBy.get(pin) ?? [];
      list.push(p.full_name);
      servingBy.set(pin, list);
    }
  }

  // Aggregate demand by pincode.
  const demand = new Map<string, { count: number; cities: Set<string> }>();
  for (const b of bookings) {
    const pin = (b.pincode ?? "").trim();
    if (!pin) continue;
    const entry = demand.get(pin) ?? { count: 0, cities: new Set<string>() };
    entry.count += 1;
    if (b.city) entry.cities.add(b.city);
    demand.set(pin, entry);
  }

  const rows: Row[] = [...demand.entries()]
    .map(([pincode, d]) => ({
      pincode,
      bookings: d.count,
      cities: [...d.cities],
      serving: servingBy.get(pincode) ?? [],
    }))
    // Gaps first, then by demand.
    .sort(
      (a, b) =>
        a.serving.length - b.serving.length || b.bookings - a.bookings,
    );

  const gapRows = rows.filter((r) => r.serving.length === 0);
  const gapDemand = gapRows.reduce((s, r) => s + r.bookings, 0);

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Coverage gaps</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Pincodes customers are booking from, and whether an active Pandit serves
        them. Gaps are your recruitment targets.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-foreground/65">Pincodes with demand</div>
          <div className="mt-1 font-heading text-2xl text-maroon-700">
            {rows.length}
          </div>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-foreground/65">Uncovered pincodes</div>
          <div className="mt-1 font-heading text-2xl text-maroon-700">
            {gapRows.length}
          </div>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="text-xs text-foreground/65">Bookings in gaps</div>
          <div className="mt-1 font-heading text-2xl text-maroon-700">
            {gapDemand}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/65">
          No booking demand recorded yet. As customers book, this map fills in.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-saffron-100">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-left text-xs text-foreground/65">
              <tr>
                <th className="px-4 py-2 font-medium">Pincode</th>
                <th className="px-4 py-2 font-medium">Bookings</th>
                <th className="px-4 py-2 font-medium">Area</th>
                <th className="px-4 py-2 font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = statusFor(r.serving.length);
                return (
                  <tr key={r.pincode} className="border-t border-saffron-50">
                    <td className="px-4 py-2 font-medium text-maroon-700">
                      {r.pincode}
                    </td>
                    <td className="px-4 py-2">{r.bookings}</td>
                    <td className="px-4 py-2 text-foreground/65">
                      {r.cities.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}
                        title={r.serving.join(", ") || "No active priest serves this pincode"}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
