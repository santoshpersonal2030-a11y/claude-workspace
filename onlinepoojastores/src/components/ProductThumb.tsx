// A decorative placeholder shown until real product photos are uploaded.
// Renders the product's initials on a warm gradient so the grid looks tidy.
export default function ProductThumb({
  name,
  imageUrl,
  className = '',
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-gold-soft to-gold/60 ${className}`}
      aria-hidden
    >
      <span className="text-3xl font-bold text-burgundy/70">{initials}</span>
    </div>
  );
}
