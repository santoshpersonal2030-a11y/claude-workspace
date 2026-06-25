import { createAdminClient } from "@/lib/supabase/admin";
import { saveCoupon, deleteCoupon } from "@/app/[locale]/admin/actions";
import { formatINR } from "@/lib/poojas";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminCouponsPage() {
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Coupons</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Promo codes for the samagri store. Percent or flat off, with optional
        minimum order, max discount, usage limit and expiry.
      </p>

      {/* Create / edit */}
      <form
        action={saveCoupon}
        className="mt-4 grid items-end gap-3 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm sm:grid-cols-3 lg:grid-cols-7"
      >
        <label className="text-xs text-foreground/65">
          Code
          <input name="code" required placeholder="DIWALI10" className={`mt-1 ${inputClass} uppercase`} />
        </label>
        <label className="text-xs text-foreground/65">
          Type
          <select name="type" className={`mt-1 ${inputClass}`}>
            <option value="percent">Percent %</option>
            <option value="flat">Flat ₹</option>
          </select>
        </label>
        <label className="text-xs text-foreground/65">
          Value
          <input name="value" type="number" required className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          Min order ₹
          <input name="min_order" type="number" defaultValue={0} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          Max disc ₹
          <input name="max_discount" type="number" placeholder="—" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          Usage limit
          <input name="usage_limit" type="number" placeholder="∞" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="text-xs text-foreground/65">
          Expires
          <input name="expires_at" type="date" className={`mt-1 ${inputClass}`} />
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/70 lg:col-span-6">
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        <button
          type="submit"
          className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
        >
          Save coupon
        </button>
      </form>

      {/* Existing */}
      <div className="mt-4 space-y-2">
        {(coupons ?? []).length === 0 && (
          <p className="text-sm text-foreground/65">No coupons yet.</p>
        )}
        {coupons?.map((c) => (
          <div
            key={c.code}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-saffron-100 bg-white p-3 text-sm shadow-sm"
          >
            <span className="font-mono font-semibold text-maroon-700">
              {c.code}
            </span>
            <span className="text-foreground/70">
              {c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`}
              {c.max_discount ? ` (max ${formatINR(c.max_discount)})` : ""}
            </span>
            <span className="text-xs text-foreground/65">
              {c.min_order > 0 ? `min ${formatINR(c.min_order)} · ` : ""}
              used {c.used_count}
              {c.usage_limit ? `/${c.usage_limit}` : ""}
              {c.expires_at ? ` · till ${c.expires_at}` : ""}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                c.active
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {c.active ? "Active" : "Inactive"}
            </span>
            <form action={deleteCoupon} className="ml-auto">
              <input type="hidden" name="code" value={c.code} />
              <button
                type="submit"
                className="rounded-full border border-stone-200 px-3 py-1 text-xs text-foreground/65 hover:border-red-300 hover:text-red-600"
              >
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
