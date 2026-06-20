import Image from "next/image";

// Images uploaded to our Supabase bucket can be optimised by next/image; any
// other (pasted) URL falls back to a plain <img> so it still renders.
const SUPABASE_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "";
  } catch {
    return "";
  }
})();

function isOptimizable(url: string): boolean {
  try {
    return new URL(url).hostname === SUPABASE_HOST;
  } catch {
    return false;
  }
}

// Product image with an emoji fallback. Callers size it via className.
export default function ProductThumb({
  imageUrl,
  name,
  className = "",
  emojiSize = "text-4xl",
  sizes = "(max-width: 768px) 50vw, 25vw",
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
  emojiSize?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-cream-100/60 ${className}`}
    >
      {imageUrl ? (
        isOptimizable(imageUrl) ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes={sizes}
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <span className={emojiSize} aria-hidden="true">
          🪔
        </span>
      )}
    </div>
  );
}
