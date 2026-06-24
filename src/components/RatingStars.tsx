// Compact rating display: ★ 4.6 (120). Presentational only.
export default function RatingStars({
  rating,
  reviewCount,
  className = "",
}: {
  rating: number;
  reviewCount: number;
  className?: string;
}) {
  if (!reviewCount) {
    return <span className={`text-xs text-foreground/65 ${className}`}>No reviews yet</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${className}`}>
      <span className="text-gold-500" aria-hidden="true">
        ★
      </span>
      <span className="font-medium text-foreground/80">{rating.toFixed(1)}</span>
      <span className="text-foreground/65">({reviewCount})</span>
    </span>
  );
}
