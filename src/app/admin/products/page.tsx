import { createAdminClient } from "@/lib/supabase/admin";
import { saveProduct } from "@/app/admin/actions";

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-2 py-1.5 text-sm outline-none focus:border-saffron-400";

export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Products</h1>
      <p className="mt-1 text-sm text-foreground/60">
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
          <input name="name" placeholder="Name" required className={inputClass} />
          <input name="slug" placeholder="slug" required className={inputClass} />
          <input
            name="category"
            placeholder="Category"
            className={inputClass}
          />
          <input
            name="price"
            type="number"
            placeholder="Price ₹"
            required
            className={inputClass}
          />
          <input
            name="mrp"
            type="number"
            placeholder="MRP ₹ (optional)"
            className={inputClass}
          />
          <input
            name="stock"
            type="number"
            placeholder="Stock"
            defaultValue={0}
            className={inputClass}
          />
          <input
            name="image_url"
            placeholder="Image URL (optional)"
            className={`${inputClass} sm:col-span-2 lg:col-span-3`}
          />
          <input
            name="description"
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
            className="rounded-full bg-saffron-600 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-700"
          >
            Add product
          </button>
        </div>
      </form>

      {/* Existing */}
      <div className="mt-8 space-y-3">
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
            <input
              name="image_url"
              defaultValue={p.image_url ?? ""}
              placeholder="Image URL"
              className={`${inputClass} sm:col-span-6`}
            />
            <input name="name" defaultValue={p.name} className={inputClass} />
            <input
              name="category"
              defaultValue={p.category ?? ""}
              placeholder="Category"
              className={inputClass}
            />
            <input
              name="price"
              type="number"
              defaultValue={p.price}
              className={inputClass}
            />
            <input
              name="mrp"
              type="number"
              defaultValue={p.mrp ?? ""}
              placeholder="MRP"
              className={inputClass}
            />
            <input
              name="stock"
              type="number"
              defaultValue={p.stock}
              className={inputClass}
            />
            <div className="flex items-center gap-3">
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
                className="rounded-full bg-saffron-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-saffron-700"
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
