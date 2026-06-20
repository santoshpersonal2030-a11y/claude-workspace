import BrandLogoUploader from "@/components/admin/BrandLogoUploader";

export const metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Settings</h1>

      <div className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg text-maroon-700">Brand logo</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Shown on invoices, receipts and credit notes (PDF and on-screen).
        </p>
        <div className="mt-4">
          <BrandLogoUploader />
        </div>
      </div>
    </div>
  );
}
