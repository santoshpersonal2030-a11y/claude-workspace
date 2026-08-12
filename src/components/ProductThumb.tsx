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
        /* NO PHOTOGRAPH. Every storage bucket on this project is empty, so this is what every
           product actually renders today — and the emoji is aria-hidden, which left the whole
           thumbnail with nothing to announce. Four different pages wrap this in a bare
           <Link href="/store/…">, so each of those became a link a screen reader could only
           read out as its URL: 216 of them across 58 pages, found the moment the database was
           connected and the store pages existed to be audited at all.
           The name goes back in, visually hidden. The moment real photos are uploaded the <img
           alt> above carries it instead and this branch stops rendering — but the fix must not
           depend on that ever happening. */
        <>
          <span className={emojiSize} aria-hidden="true">
            🪔
          </span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </div>
  );
}
