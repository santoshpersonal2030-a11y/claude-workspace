import Image from "next/image";

// Priest avatar: shows the uploaded photo when present, else a saffron
// monogram of the priest's name. Works in both server and client components.
// Callers size the circle via `className` (must set height & width).

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

function initials(name: string): string {
  return name
    .replace(/^(Pandit|Acharya|Vidwan)\s+/i, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PanditAvatar({
  photoUrl,
  name,
  className = "",
  textSize = "text-lg",
  sizes = "80px",
}: {
  photoUrl: string | null;
  name: string;
  className?: string;
  textSize?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-saffron-100 font-heading text-saffron-700 ${textSize} ${className}`}
    >
      {photoUrl ? (
        isOptimizable(photoUrl) ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes={sizes}
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </div>
  );
}
