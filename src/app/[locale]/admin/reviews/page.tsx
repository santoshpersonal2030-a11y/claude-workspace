import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import { setReviewHidden } from "@/app/[locale]/admin/actions";

export const metadata = { title: "Reviews — Admin" };

type Row = {
  id: string;
  kind: "pandit" | "product";
  subject: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_name: string;
  hidden: boolean;
  created_at: string;
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireCapability("reviews");
  const { filter } = await searchParams;
  const showHidden = filter === "hidden";
  const admin = createAdminClient();

  const [pandit, product] = await Promise.all([
    admin
      .from("pandit_reviews")
      .select("id, rating, title, body, reviewer_name, hidden, created_at, pandits(full_name)")
      .eq("hidden", showHidden)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("product_reviews")
      .select("id, rating, title, body, reviewer_name, hidden, created_at, products(name)")
      .eq("hidden", showHidden)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const rows: Row[] = [
    ...(pandit.data ?? []).map((r) => ({
      id: r.id,
      kind: "pandit" as const,
      subject: r.pandits?.full_name ?? "Pandit",
      rating: r.rating,
      title: r.title,
      body: r.body,
      reviewer_name: r.reviewer_name,
      hidden: r.hidden,
      created_at: r.created_at,
    })),
    ...(product.data ?? []).map((r) => ({
      id: r.id,
      kind: "product" as const,
      subject: r.products?.name ?? "Product",
      rating: r.rating,
      title: r.title,
      body: r.body,
      reviewer_name: r.reviewer_name,
      hidden: r.hidden,
      created_at: r.created_at,
    })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">
        Review moderation
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Hide reviews that violate guidelines. Hidden reviews vanish from public
        pages, and pandit ratings recompute automatically.
      </p>

      <div className="mt-4 flex gap-1">
        {[
          { k: "live", label: "Published" },
          { k: "hidden", label: "Hidden" },
        ].map((t) => (
          <a
            key={t.k}
            href={`/admin/reviews?filter=${t.k}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              (t.k === "hidden") === showHidden
                ? "bg-saffron-600 text-white"
                : "border border-saffron-200 text-foreground/70 hover:bg-saffron-50"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/55">
          No {showHidden ? "hidden" : "published"} reviews.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div
              key={`${r.kind}-${r.id}`}
              className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-saffron-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-saffron-700">
                  {r.kind}
                </span>
                <span className="font-medium text-maroon-700">{r.subject}</span>
                <span className="text-amber-500">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(Math.max(0, 5 - r.rating))}
                </span>
                <span className="text-xs text-foreground/45">
                  by {r.reviewer_name} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </span>
                <form
                  action={setReviewHidden}
                  className="ml-auto"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="kind" value={r.kind} />
                  <input
                    type="hidden"
                    name="hidden"
                    value={(!r.hidden).toString()}
                  />
                  <button
                    type="submit"
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      r.hidden
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-stone-200 text-foreground/60 hover:border-red-300 hover:text-red-600"
                    }`}
                  >
                    {r.hidden ? "Restore" : "Hide"}
                  </button>
                </form>
              </div>
              {r.title && (
                <p className="mt-2 text-sm font-medium text-foreground/80">
                  {r.title}
                </p>
              )}
              {r.body && (
                <p className="mt-1 text-sm text-foreground/70">{r.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
