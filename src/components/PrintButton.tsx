"use client";

// Triggers the browser print dialog; hidden when printing.
export default function PrintButton({
  label = "Print / Save PDF",
}: {
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700 print:hidden"
    >
      {label}
    </button>
  );
}
