import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminContext } from "@/lib/admin";
import { can } from "@/lib/roles";
import {
  approvePanditApplication,
  rejectPanditApplication,
} from "@/app/[locale]/admin/actions";
import { RevealKycId } from "./reveal-kyc-id";

export const metadata = { title: "Priest applications — Admin" };

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-stone-200 text-stone-600",
};

export default async function PanditApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status ?? "pending";
  const admin = createAdminClient();

  // Whether this admin may reveal full KYC ID numbers (owner/manager, not
  // support). Drives the per-row "Reveal" control; the action re-checks too.
  const ctx = await getAdminContext();
  const canRevealKyc = can(ctx?.role ?? null, "kyc");

  let query = admin
    .from("pandit_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  const { data: apps } = await query;

  // Short-lived signed URLs for KYC documents (private bucket).
  const docUrls = new Map<string, string>();
  await Promise.all(
    (apps ?? [])
      .filter((a) => a.id_doc_path)
      .map(async (a) => {
        const { data } = await admin.storage
          .from("kyc-documents")
          .createSignedUrl(a.id_doc_path!, 300);
        if (data?.signedUrl) docUrls.set(a.id, data.signedUrl);
      }),
  );

  const tabs = ["pending", "approved", "rejected", "all"];

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">
        Priest applications
      </h1>
      <p className="mt-1 text-sm text-foreground/65">
        Review self-onboarding applications. Approving creates a verified pandit
        profile automatically.
      </p>

      <div className="mt-4 flex gap-1">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/pandit-applications?status=${t}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === t
                ? "bg-saffron-700 text-white"
                : "border border-saffron-200 text-foreground/70 hover:bg-saffron-50"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {(apps ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-foreground/65">
          No {filter === "all" ? "" : filter} applications.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {apps!.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {a.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.photo_url}
                      alt={a.full_name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-50 text-xl">
                      🕉️
                    </div>
                  )}
                  <div>
                    <h3 className="font-heading text-lg text-maroon-700">
                      {a.full_name}
                    </h3>
                    <p className="text-sm text-foreground/65">
                      {a.phone}
                      {a.email ? ` · ${a.email}` : ""}
                      {a.city ? ` · ${a.city}` : ""}
                    </p>
                    <p className="text-xs text-foreground/65">
                      Applied{" "}
                      {new Date(a.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    STATUS_STYLE[a.status] ?? "bg-stone-100"
                  }`}
                >
                  {a.status}
                </span>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Experience">
                  {a.experience_years ? `${a.experience_years} yrs` : "—"}
                </Row>
                <Row label="Languages">
                  {a.languages?.join(", ") || "—"}
                </Row>
                <Row label="Specialisations">
                  {a.specializations?.join(", ") || "—"}
                </Row>
                <Row label="Home pincode">{a.home_pincode || "—"}</Row>
                <Row label="ID">
                  {a.id_type ? `${a.id_type} · ${a.id_number_masked ?? "—"}` : "—"}
                  {canRevealKyc && a.id_number_enc && (
                    <RevealKycId applicationId={a.id} />
                  )}
                  {docUrls.has(a.id) && (
                    <a
                      href={docUrls.get(a.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-saffron-700 underline"
                    >
                      View document
                    </a>
                  )}
                </Row>
                {a.created_pandit_id && (
                  <Row label="Pandit profile">created ✓</Row>
                )}
              </dl>

              {a.qualifications && (
                <p className="mt-3 whitespace-pre-line rounded-lg bg-cream p-3 text-xs text-foreground/70">
                  {a.qualifications}
                </p>
              )}
              {a.bio && (
                <p className="mt-2 text-sm text-foreground/70">{a.bio}</p>
              )}
              {a.review_notes && (
                <p className="mt-2 text-xs text-foreground/65">
                  Note: {a.review_notes}
                </p>
              )}

              {a.status === "pending" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-saffron-50 pt-4">
                  <form action={approvePanditApplication}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve & create profile
                    </button>
                  </form>
                  <form
                    action={rejectPanditApplication}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <input
                      name="review_notes"
                      placeholder="Reason (optional)"
                      className="rounded-lg border border-saffron-200 bg-cream px-3 py-1.5 text-xs outline-none focus:border-saffron-400"
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-stone-200 px-4 py-2 text-sm text-foreground/65 hover:border-red-300 hover:text-red-600"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-foreground/65">{label}:</dt>
      <dd className="text-foreground/80">{children}</dd>
    </div>
  );
}
