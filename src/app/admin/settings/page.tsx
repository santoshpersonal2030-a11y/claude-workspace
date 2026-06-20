import BrandLogoUploader from "@/components/admin/BrandLogoUploader";
import { getCompanySettings } from "@/lib/company-settings";
import { COMPANY } from "@/lib/company";
import { INDIAN_STATES } from "@/lib/india";
import { saveCompanySettings } from "@/app/admin/actions";

export const metadata = { title: "Settings" };

const fieldClass =
  "mt-1 w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function AdminSettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl text-maroon-800">Settings</h1>

      {/* Company / seller details */}
      <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg text-maroon-700">
          Business details
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          Shown as the seller on tax invoices, receipts and credit notes. Saved
          to the database — no redeploy needed. Blank fields fall back to the
          build-time defaults.
        </p>

        <form action={saveCompanySettings} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-foreground/70">Legal name</span>
              <input
                name="name"
                defaultValue={settings.name}
                placeholder={COMPANY.name}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-foreground/70">GSTIN</span>
              <input
                name="gstin"
                defaultValue={settings.gstin}
                placeholder={COMPANY.gstin}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-foreground/70">
                State (place of supply)
              </span>
              <select
                name="state"
                defaultValue={settings.state}
                className={fieldClass}
              >
                <option value="">— Default ({COMPANY.state}) —</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-foreground/70">
                UPI ID (for invoice QR)
              </span>
              <input
                name="upi"
                defaultValue={settings.upi}
                placeholder="name@bank"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-foreground/70">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={settings.email}
                placeholder={COMPANY.email}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-foreground/70">Phone</span>
              <input
                name="phone"
                defaultValue={settings.phone}
                placeholder={COMPANY.phone}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-foreground/70">
              Address (one line per row)
            </span>
            <textarea
              name="address"
              defaultValue={settings.address}
              rows={3}
              placeholder={COMPANY.addressLines.join("\n")}
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
          >
            Save business details
          </button>
        </form>
      </div>

      {/* Brand logo */}
      <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm">
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
