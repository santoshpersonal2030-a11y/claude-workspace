import { trackingUrl, carrierName } from "@/lib/carriers";

// Renders the tracking number as a link to the carrier's tracking page when
// possible, otherwise as plain text.
export default function TrackingLink({
  carrier,
  trackingNumber,
  className = "",
}: {
  carrier: string | null;
  trackingNumber: string | null;
  className?: string;
}) {
  if (!trackingNumber) return null;
  const url = trackingUrl(carrier, trackingNumber);
  const name = carrierName(carrier);
  const label = `${name ? `${name}: ` : ""}${trackingNumber}`;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium text-saffron-700 hover:text-saffron-800 ${className}`}
      >
        {label} ↗
      </a>
    );
  }
  return <span className={`font-medium ${className}`}>{label}</span>;
}
