import type { ProductReview } from "@/lib/queries";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-gold-500" aria-label={`${value} out of 5`}>
      {"★".repeat(value)}
      <span className="text-foreground/20">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ProductReviews({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: ProductReview[];
  rating: number;
  reviewCount: number;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl text-maroon-800">
        Customer reviews
      </h2>

      {reviews.length > 0 && (
        <div className="mt-4 flex flex-col gap-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="text-center sm:w-40">
            <div className="font-heading text-4xl text-maroon-800">
              {rating.toFixed(1)}
            </div>
            <div className="mt-1 text-gold-500">
              {"★".repeat(Math.round(rating))}
              <span className="text-foreground/20">
                {"★".repeat(5 - Math.round(rating))}
              </span>
            </div>
            <div className="mt-1 text-xs text-foreground/55">
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length;
              const pct = reviews.length
                ? Math.round((count / reviews.length) * 100)
                : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-foreground/60">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-saffron-50">
                    <div
                      className="h-full rounded-full bg-gold-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-foreground/50">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-maroon-700">
                    {r.reviewerName}
                  </span>
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    ✓ Verified Buyer
                  </span>
                </span>
                <span className="text-xs text-foreground/45">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-1">
                <Stars value={r.rating} />
              </div>
              {r.title && (
                <p className="mt-2 font-medium text-foreground/85">{r.title}</p>
              )}
              {r.body && (
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {r.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
