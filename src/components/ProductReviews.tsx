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
      <div className="flex items-baseline gap-3">
        <h2 className="font-heading text-2xl text-maroon-800">
          Customer reviews
        </h2>
        {reviewCount > 0 && (
          <span className="text-sm text-foreground/60">
            <span className="text-gold-500">★</span> {rating.toFixed(1)} ·{" "}
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

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
                <span className="font-medium text-maroon-700">
                  {r.reviewerName}
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
