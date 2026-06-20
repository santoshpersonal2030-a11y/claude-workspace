// Brand logo image for HTML invoices/receipts (served by /api/brand-logo).
export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/api/brand-logo"
      alt=""
      className={`rounded ${className}`}
    />
  );
}
