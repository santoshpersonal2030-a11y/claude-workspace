// Consistent wrapper for the text-heavy info pages (About, Shipping, etc.).
export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-burgundy-dark">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-burgundy-dark/70">{subtitle}</p>
      )}
      <div className="mt-6 flex flex-col gap-4 text-[15px] leading-relaxed text-burgundy-dark/85 [&_a]:font-medium [&_a]:text-burgundy [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-burgundy-dark [&_li]:ml-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
