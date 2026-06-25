import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregatePriestStats,
  overallTotals,
  type PriestEvent,
} from "@/lib/priest-analytics";

export const metadata = { title: "Priest insights — Admin" };

function pct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

function mins(v: number | null): string {
  if (v === null) return "—";
  if (v < 60) return `${v}m`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Colour the acceptance rate so problem priests stand out.
function rateClass(v: number | null): string {
  if (v === null) return "text-foreground/65";
  if (v >= 0.8) return "text-emerald-700";
  if (v >= 0.5) return "text-amber-600";
  return "text-red-600";
}

export default async function PriestAnalyticsPage() {
  const admin = createAdminClient();
  const [{ data: events }, { data: pandits }] = await Promise.all([
    admin
      .from("booking_priest_events")
      .select("pandit_id, booking_id, action, created_at")
      .order("created_at", { ascending: true })
      .limit(5000),
    admin.from("pandits").select("id, full_name"),
  ]);

  const nameById = new Map((pandits ?? []).map((p) => [p.id, p.full_name]));
  const stats = aggregatePriestStats(
    (events ?? []).map((e) => ({
      panditId: e.pandit_id,
      bookingId: e.booking_id,
      action: e.action as PriestEvent["action"],
      createdAt: e.created_at,
    })),
  );
  const totals = overallTotals(stats);

  const cards = [
    { label: "Active priests", value: String(totals.priests) },
    { label: "Assignments", value: String(totals.assigned) },
    { label: "Acceptance rate", value: pct(totals.acceptanceRate) },
    { label: "Avg. response", value: mins(totals.avgResponseMins) },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Priest insights</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Acceptance and response performance from the assignment log. Response
        time is measured from assignment to the priest&apos;s first reply.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-foreground/65">{c.label}</p>
            <p className="mt-1 font-heading text-2xl text-maroon-700">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {stats.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/65">
          No assignment activity logged yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-saffron-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-saffron-100 text-left text-xs text-foreground/65">
                <th scope="col" className="px-4 py-3">Priest</th>
                <th scope="col" className="px-3 py-3 text-right">Assigned</th>
                <th scope="col" className="px-3 py-3 text-right">Accepted</th>
                <th scope="col" className="px-3 py-3 text-right">Declined</th>
                <th scope="col" className="px-3 py-3 text-right">Proposed</th>
                <th scope="col" className="px-3 py-3 text-right">Acceptance</th>
                <th scope="col" className="px-3 py-3 text-right">Avg reply</th>
                <th scope="col" className="px-3 py-3 text-right">Median</th>
                <th scope="col" className="px-3 py-3 text-right">Awaiting</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr
                  key={s.panditId}
                  className="border-b border-saffron-50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground/80">
                    {nameById.get(s.panditId) ?? s.panditId.slice(0, 8)}
                  </td>
                  <td className="px-3 py-3 text-right">{s.assigned}</td>
                  <td className="px-3 py-3 text-right text-emerald-700">
                    {s.accepted}
                  </td>
                  <td className="px-3 py-3 text-right text-red-600">
                    {s.declined}
                  </td>
                  <td className="px-3 py-3 text-right text-sky-600">
                    {s.proposed}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-semibold ${rateClass(s.acceptanceRate)}`}
                  >
                    {pct(s.acceptanceRate)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {mins(s.avgResponseMins)}
                  </td>
                  <td className="px-3 py-3 text-right text-foreground/65">
                    {mins(s.medianResponseMins)}
                  </td>
                  <td className="px-3 py-3 text-right text-foreground/65">
                    {s.pending || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
