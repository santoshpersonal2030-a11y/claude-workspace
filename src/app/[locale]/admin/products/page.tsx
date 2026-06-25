import { createAdminClient } from "@/lib/supabase/admin";
import { saveProduct } from "@/app/[locale]/admin/actions";
import ProductImageManager from "@/components/admin/ProductImageManager";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const [{ data: products }, { data: subs }] = await Promise.all([
    admin.from("products").select("*").order("name", { ascending: true }),
    admin
      .from("stock_subscriptions")
      .select("product_id")
      .is("notified_at", null),
  ]);

  // Demand signal: how many people are waiting for each product to restock.
  const waiting = new Map<string, number>();
  for (const s of subs ?? []) {
    waiting.set(s.product_id, (waiting.get(s.product_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Products</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Edit a row and press Save. Uncheck Active to hide an item from the
        store.
      </p>

      {/* Add new */}
      <form
        action={saveProduct}
        className="mt-6 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        <h2 className="font-heading text-lg text-maroon-700">Add a product</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="name" aria-label="Product name" placeholder="Name" required className={inputClass} />
          <input name="slug" aria-label="URL slug" placeholder="slug" required className={inputClass} />
          <input
            name="category"
            aria-label="Category"
            placeholder="Category"
            className={inputClass}
          />
          <input
            name="price"
            type="number"
            aria-label="Price in rupees"
            placeholder="Price ₹"
            required
            className={inputClass}
          />
          <input
            name="mrp"
            type="number"
            aria-label="MRP in rupees"
            placeholder="MRP ₹ (optional)"
            className={inputClass}
          />
          <input
            name="stock"
            type="number"
            aria-label="Stock quantity"
            placeholder="Stock"
            defaultValue={0}
            className={inputClass}
          />
          <input
            name="gst_rate"
            type="number"
            step="0.01"
            aria-label="GST percentage"
            placeholder="GST %"
            defaultValue={18}
            className={inputClass}
          />
          <input
            name="hsn_code"
            aria-label="HSN code"
            placeholder="HSN code"
            className={inputClass}
          />
          <input
            name="image_url"
            aria-label="Image URL"
            placeholder="Image URL (optional)"
            className={`${inputClass} sm:col-span-2 lg:col-span-2`}
          />
          <label className="flex items-center text-xs text-foreground/65">
            <span className="mr-2">or upload:</span>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="text-xs"
            />
          </label>
          <input
            name="description"
            aria-label="Description"
            placeholder="Description"
            className={`${inputClass} sm:col-span-2 lg:col-span-3`}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input type="checkbox" name="active" defaultChecked /> Active
          </label>
          <button
            type="submit"
            className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            Add product
          </button>
        </div>
      </form>

      {/* Existing */}
      <div className="mt-6 space-y-3">
        {products?.map((p) => (
          <form
            key={p.id}
            action={saveProduct}
            className="grid items-center gap-2 rounded-xl border border-saffron-100 bg-white p-3 shadow-sm sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_auto]"
          >
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="slug" value={p.slug} />
            <input
              type="hidden"
              name="description"
              defaultValue={p.description ?? ""}
            />
            <ProductImageManager
              slug={p.slug}
              initialImages={
                p.images?.length ? p.images : p.image_url ? [p.image_url] : []
              }
            />
            <input
              name="name"
              aria-label="Product name"
              defaultValue={p.name}
              className={inputClass}
            />
            <input
              name="category"
              aria-label="Category"
              defaultValue={p.category ?? ""}
              placeholder="Category"
              className={inputClass}
            />
            <input
              name="price"
              type="number"
              aria-label="Price in rupees"
              defaultValue={p.price}
              className={inputClass}
            />
            <input
              name="mrp"
              type="number"
              aria-label="MRP in rupees"
              defaultValue={p.mrp ?? ""}
              placeholder="MRP"
              className={inputClass}
            />
            <input
              name="stock"
              type="number"
              aria-label="Stock quantity"
              defaultValue={p.stock}
              className={inputClass}
            />
            <div className="flex items-center gap-2 text-xs text-foreground/65 sm:col-span-6">
              <span>GST %</span>
              <input
                name="gst_rate"
                type="number"
                step="0.01"
                aria-label="GST percentage"
                defaultValue={Number(p.gst_rate)}
                className={`${inputClass} w-20`}
              />
              <span>HSN</span>
              <input
                name="hsn_code"
                aria-label="HSN code"
                defaultValue={p.hsn_code ?? ""}
                placeholder="HSN code"
                className={`${inputClass} w-32`}
              />
            </div>
            <div className="flex items-center gap-3">
              {(waiting.get(p.id) ?? 0) > 0 && (
                <span
                  className="whitespace-nowrap rounded-full bg-maroon-50 px-2 py-0.5 text-xs font-medium text-maroon-700"
                  title="People waiting for a restock"
                >
                  🔔 {waiting.get(p.id)}
                </span>
              )}
              <label className="flex items-center gap-1 text-xs text-foreground/70">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={p.active}
                />
                Active
              </label>
              <button
                type="submit"
                className="rounded-full bg-saffron-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-800"
              >
                Save
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
