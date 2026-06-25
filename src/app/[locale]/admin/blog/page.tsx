import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCapability } from "@/lib/admin";
import { saveBlogPost, deleteBlogPost } from "@/app/[locale]/admin/actions";
import { blogPosts } from "@/lib/blog";

export const metadata = { title: "Blog — Admin" };

const inputClass =
  "w-full rounded-lg border border-saffron-200 bg-cream px-3 py-2 text-sm outline-none focus:border-saffron-400";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireCapability("content");
  const { edit } = await searchParams;
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  const editing = edit ? posts?.find((p) => p.id === edit) : undefined;

  return (
    <div>
      <h1 className="font-heading text-2xl text-maroon-800">Blog</h1>
      <p className="mt-1 text-sm text-foreground/65">
        Write posts in markdown-lite: lines starting with{" "}
        <code>## </code> are section headings; blank lines separate paragraphs.
      </p>

      {/* Editor */}
      <form
        action={saveBlogPost}
        className="mt-6 space-y-3 rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm"
      >
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-foreground/65">
            Title
            <input
              name="title"
              required
              defaultValue={editing?.title ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Slug (blank = from title)
            <input
              name="slug"
              defaultValue={editing?.slug ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Category
            <input
              name="category"
              defaultValue={editing?.category ?? "General"}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Reading minutes
            <input
              name="reading_minutes"
              type="number"
              min={1}
              defaultValue={editing?.reading_minutes ?? 4}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="text-xs text-foreground/65">
            Publish date
            <input
              name="published_at"
              type="date"
              defaultValue={editing?.published_at ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm text-foreground/70">
            <input
              type="checkbox"
              name="published"
              defaultChecked={editing?.published ?? false}
            />
            Published
          </label>
        </div>
        <label className="block text-xs text-foreground/65">
          Excerpt
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={editing?.excerpt ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-foreground/65">
          Content
          <textarea
            name="content"
            rows={12}
            defaultValue={editing?.content ?? ""}
            placeholder={"Opening paragraph.\n\n## A heading\nMore text..."}
            className={`mt-1 font-mono ${inputClass}`}
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            {editing ? "Update post" : "Create post"}
          </button>
          {editing && (
            <Link
              href="/admin/blog"
              className="text-sm text-foreground/65 hover:text-saffron-700"
            >
              Cancel edit
            </Link>
          )}
        </div>
      </form>

      {/* DB posts */}
      <h2 className="mt-6 font-heading text-lg text-maroon-700">Posts</h2>
      <div className="mt-3 space-y-2">
        {(posts ?? []).length === 0 && (
          <p className="text-sm text-foreground/65">
            No DB posts yet. The {blogPosts.length} built-in seed posts below
            stay live until you override them by slug.
          </p>
        )}
        {posts?.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-saffron-100 bg-white p-3 text-sm shadow-sm"
          >
            <span className="font-medium text-maroon-700">{p.title}</span>
            <span className="text-xs text-foreground/65">/{p.slug}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                p.published
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {p.published ? "Published" : "Draft"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <a
                href={`/admin/blog?edit=${p.id}`}
                className="text-xs font-semibold text-saffron-700 hover:text-saffron-800"
              >
                Edit
              </a>
              <form action={deleteBlogPost}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="text-xs text-foreground/65 hover:text-red-600"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Seed posts (read-only reference) */}
      <h2 className="mt-6 font-heading text-lg text-maroon-700">
        Built-in posts
      </h2>
      <p className="mt-1 text-xs text-foreground/65">
        Shipped in code. Create a DB post with the same slug to override one.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-foreground/70">
        {blogPosts.map((p) => (
          <li key={p.slug}>
            {p.title} <span className="text-xs text-foreground/65">/{p.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
