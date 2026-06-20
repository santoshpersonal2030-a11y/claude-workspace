// Product image with an emoji fallback. Uses a plain <img> so any image host
// works without next.config remotePatterns; callers size it via className.
export default function ProductThumb({
  imageUrl,
  name,
  className = "",
  emojiSize = "text-4xl",
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  emojiSize?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden bg-cream-100/60 ${className}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={emojiSize} aria-hidden="true">
          🪔
        </span>
      )}
    </div>
  );
}
